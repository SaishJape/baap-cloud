import { useState, useEffect } from 'react';
import { Database, Bot, Plus, ArrowRight, Settings2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { chatbotService, Chatbot } from '@/services/chatbotService';

export default function Data() {
  const navigate = useNavigate();
  const { userId, clientId } = useAuth();
  const [chatbotName, setChatbotName] = useState('');
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchChatbots();
  }, [userId, clientId]);

  const fetchChatbots = async () => {
    if (!userId || !clientId) return;
    try {
      setIsLoading(true);
      const response = await chatbotService.getChatbots(userId, clientId);
      // The API returns { data: [ { ... } ] } based on curl example.
      // But my service returns response.data directly which IS the object containing "data": [...]
      // Wait, in chatbotService.ts: return response.data;
      // API: { success: true, ..., data: [ ... ] }
      // So response.data is the array.
      setChatbots(response.data || []);
    } catch (error) {
      console.error("Failed to fetch chatbots", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChatbot = async () => {
    if (!chatbotName.trim()) {
      toast.error('Please enter a chatbot name');
      return;
    }

    const configId = localStorage.getItem('config_id');
    if (!configId) {
      toast.error("Please configure your model settings first.");
      navigate('/config');
      return;
    }

    setIsCreating(true);
    try {
      const response = await chatbotService.createChatbot({
        config_id: configId,
        title: chatbotName.trim()
      });

      if (response.success || response.data) {
        toast.success(`Chatbot "${chatbotName}" created`);
        setChatbotName('');
        fetchChatbots(); // Refresh list
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create chatbot');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddData = (chatbot: Chatbot, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent card click if button is clicked
    // Pass ID and Name via URL params
    navigate(`/chatbot-data?id=${chatbot.id}&name=${encodeURIComponent(chatbot.title)}`);
  };

  const handleCardClick = (chatbot: Chatbot) => {
    // Navigate to chatbot details or data page.
    // The user said "open that perticular chatbot".
    // Re-using handleAddData logic for now as it's the main "view" for a chatbot
    navigate(`/chatbot-data?id=${chatbot.id}&name=${encodeURIComponent(chatbot.title)}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Data Management</h1>
          </div>
          <p className="text-muted-foreground">Create chatbots and add training data</p>
        </div>

        {/* Create Chatbot */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Chatbot
            </CardTitle>
            <CardDescription>Give your chatbot a unique name to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="e.g., Customer Support Bot"
                value={chatbotName}
                onChange={(e) => setChatbotName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateChatbot()}
                className="flex-1"
                disabled={isCreating}
              />
              <Button onClick={handleCreateChatbot} className="shrink-0" disabled={isCreating}>
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chatbots List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Chatbots</h2>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : chatbots.length === 0 ? (
            <Card className="border border-dashed border-border">
              <CardContent className="py-12 text-center">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No chatbots yet. Create one above to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {chatbots.map((chatbot) => (
                <Card
                  key={chatbot.id}
                  className={cn(
                    "border border-border hover:border-foreground/20 transition-all cursor-pointer group"
                  )}
                  onClick={() => handleCardClick(chatbot)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <Bot className="w-6 h-6 text-foreground" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); /* Settings logic later */ }}
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <h3 className="font-semibold text-foreground mb-1">{chatbot.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {/* We don't have document count in API response yet, handling purely mostly */}
                      Config ID: {chatbot.config_id.substring(0, 8)}...
                    </p>

                    <Button
                      variant="outline"
                      className="w-full justify-between group-hover:bg-secondary"
                      onClick={(e) => handleAddData(chatbot, e)}
                    >
                      Add Data
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}