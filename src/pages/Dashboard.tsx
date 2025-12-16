import { useState, useEffect } from 'react';
import { Bot, FileText, Clock, Plus, Upload, Settings, MessageSquare, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { chatbotService, Chatbot } from '@/services/chatbotService';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, userId, clientId, chatbots: contextChatbots, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newChatbotTitle, setNewChatbotTitle] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // If we have chatbots in context (from /me), use them.
    if (contextChatbots && contextChatbots.length > 0) {
      setChatbots(contextChatbots);
      setIsLoading(false);
    } else if (userId && clientId) {
      // Fallback to fetch if context is empty (e.g. first load before /me returns, or no chatbots yet)
      loadChatbots();
    }
  }, [userId, clientId, contextChatbots]);

  const loadChatbots = async () => {
    try {
      if (!userId || !clientId) {
        console.log("Skipping loadChatbots: userId or clientId missing", { userId, clientId });
        return;
      }
      setIsLoading(true);
      console.log("Fetching chatbots with:", { userId, clientId });
      const response = await chatbotService.getChatbots(userId, clientId);
      console.log("Fetch chatbots response:", response);
      if (response && response.success) {
        setChatbots(response.data || []);
      } else {
        console.error("Fetch chatbots failed or no success flag:", response);
        // Only toast if we don't have context chatbots to fall back on? 
        // Actually, if explicit fetch fails, we should warn.
        // toast.error('Failed to load chatbots: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error("Failed to load chatbots error:", error);
      toast.error('Failed to load chatbots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChatbot = async () => {
    if (!newChatbotTitle.trim()) {
      toast.error('Please enter a chatbot name');
      return;
    }

    const configId = localStorage.getItem('config_id');
    if (!configId) {
      toast.error('No configuration found. Please configure settings first.');
      navigate('/config');
      return;
    }

    setIsCreating(true);
    try {
      const response = await chatbotService.createChatbot({
        config_id: configId,
        title: newChatbotTitle
      });

      if (response.success) {
        toast.success('Chatbot created successfully');
        setNewChatbotTitle('');
        setIsDialogOpen(false);
        // Refresh both local list and context data
        loadChatbots();
        if (refreshUserData) refreshUserData();
      }
    } catch (error: any) {
      console.error("Create chatbot error", error);
      toast.error(error.response?.data?.message || 'Failed to create chatbot');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, {user?.name || 'User'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your AI chatbots and data from one place
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Create Chatbot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chatbot</DialogTitle>
                <DialogDescription>
                  Enter a name for your new chatbot. It will use your current configuration.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newChatbotTitle}
                    onChange={(e) => setNewChatbotTitle(e.target.value)}
                    placeholder="My Awesome Chatbot"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateChatbot} disabled={isCreating}>
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Chatbot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats and Quick Links could go here, but focusing on Chatbots list for now as per requirements */}

        {/* Chatbots List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : chatbots.length === 0 ? (
            <Card className="col-span-full border-dashed border-2 border-border bg-secondary/20">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Bot className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No chatbots yet</p>
                <p className="text-sm">Create your first chatbot to get started</p>
                <Button variant="link" onClick={() => setIsDialogOpen(true)} className="mt-2">
                  Create Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            chatbots.map((bot) => (
              <Card key={bot.id} className="border border-border hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => navigate(`/chatbot-data?id=${bot.id}&name=${encodeURIComponent(bot.title)}`)}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${bot.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {bot.status}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">{bot.title}</CardTitle>
                  <CardDescription className="text-xs truncate">
                    ID: {bot.id}
                  </CardDescription>
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(bot.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}