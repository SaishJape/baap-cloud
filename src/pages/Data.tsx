import { useState } from 'react';
import { Database, Bot, Plus, ArrowRight, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Chatbot {
  id: string;
  name: string;
  documentsCount: number;
  createdAt: Date;
}

export default function Data() {
  const navigate = useNavigate();
  const [chatbotName, setChatbotName] = useState('');
  const [chatbots, setChatbots] = useState<Chatbot[]>([
    { id: '1', name: 'Product Support Bot', documentsCount: 5, createdAt: new Date() },
    { id: '2', name: 'Sales Assistant', documentsCount: 3, createdAt: new Date() },
  ]);

  const handleCreateChatbot = () => {
    if (!chatbotName.trim()) {
      toast.error('Please enter a chatbot name');
      return;
    }

    const newChatbot: Chatbot = {
      id: Math.random().toString(36).substring(7),
      name: chatbotName.trim(),
      documentsCount: 0,
      createdAt: new Date(),
    };

    setChatbots(prev => [...prev, newChatbot]);
    setChatbotName('');
    toast.success(`Chatbot "${newChatbot.name}" created`);
  };

  const handleAddData = (chatbot: Chatbot) => {
    navigate(`/chatbot-data?name=${encodeURIComponent(chatbot.name)}`);
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
              />
              <Button onClick={handleCreateChatbot} className="shrink-0">
                Create
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chatbots List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Chatbots</h2>

          {chatbots.length === 0 ? (
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
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <h3 className="font-semibold text-foreground mb-1">{chatbot.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {chatbot.documentsCount} document{chatbot.documentsCount !== 1 ? 's' : ''} uploaded
                    </p>

                    <Button
                      variant="outline"
                      className="w-full justify-between group-hover:bg-secondary"
                      onClick={() => handleAddData(chatbot)}
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