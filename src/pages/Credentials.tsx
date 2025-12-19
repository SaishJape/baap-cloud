import { useState, useEffect } from 'react';
import { Key, Copy, Check, HelpCircle, X, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { chatbotService, Chatbot } from '@/services/chatbotService';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const getEmbedCode = (chatbotId: string) => `<iframe
  src="${window.location.origin}/chatbot-widget/${chatbotId}"
  style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; z-index: 999999;"
  title="Chatbot"
></iframe>`;

export default function Credentials() {
  const { userId, clientId } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetchChatbots();
  }, [userId, clientId]);

  const fetchChatbots = async () => {
    if (!userId || !clientId) return;
    try {
      setLoading(true);
      const response = await chatbotService.getChatbots(userId, clientId);
      if (response.success) {
        setChatbots(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch chatbots", error);
      toast.error("Failed to load chatbots");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success('Embed code copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Credentials & Integration</h1>
          </div>
          <p className="text-muted-foreground">
            Get the embed code to integrate your chatbots into your website
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : chatbots.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Key className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Chatbots Found</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                You haven't created any chatbots yet. Create one to get started with integration.
              </p>
              <Link to="/config">
                <Button>Create Chatbot</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8">
            {chatbots.map((chatbot) => (
              <Card key={chatbot.id} className="border border-border overflow-hidden">
                <CardHeader className="bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{chatbot.title}</CardTitle>
                        <Badge variant={chatbot.status === 'ready' ? 'default' : 'secondary'}>
                          {chatbot.status}
                        </Badge>
                      </div>
                      <CardDescription>ID: <span className="font-mono text-xs">{chatbot.id}</span></CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHelp(true)}
                      className="gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Help
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x border-t border-border">
                    {/* Embed Code Section */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Embed Code</h3>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopy(getEmbedCode(chatbot.id), chatbot.id)}
                          className="gap-2"
                        >
                          {copiedId === chatbot.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        <pre className="bg-foreground text-background p-4 rounded-xl overflow-x-auto text-sm font-mono h-[300px] whitespace-pre-wrap">
                          <code>{getEmbedCode(chatbot.id)}</code>
                        </pre>
                      </div>
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg text-sm text-muted-foreground border border-blue-100 dark:border-blue-900/20">
                        <span className="font-medium text-blue-700 dark:text-blue-400">Note:</span> Add this code to your website's <code className="px-1 py-0.5 bg-background rounded text-xs">&lt;head&gt;</code> or <code className="px-1 py-0.5 bg-background rounded text-xs">&lt;body&gt;</code> tag.
                      </div>
                    </div>
                    {/* Test Section */}
                    <div className="p-6 bg-gray-50/50 dark:bg-gray-900/10 flex flex-col justify-center items-center text-center">
                      <div className="max-w-[260px] space-y-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                          <ExternalLink className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium">Test Your Chatbot</h3>
                          <p className="text-sm text-muted-foreground">Open the chatbot in a full-page view to test the conversation flow.</p>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => window.open(`${window.location.origin}/chatbot-widget/${chatbot.id}`, '_blank')}
                        >
                          Test Chatbot
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-lg shadow-xl border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Integration Guide</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHelp(false)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Copy the embed code</p>
                      <p className="text-sm text-muted-foreground">Click the Copy button for the specific chatbot you want to integrate.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Paste into your website</p>
                      <p className="text-sm text-muted-foreground">
                        Paste the code snippet just before the closing <code className="px-1 py-0.5 bg-secondary rounded text-xs">&lt;/body&gt;</code> tag of your HTML file.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Verify Integration</p>
                      <p className="text-sm text-muted-foreground">Refresh your website. The chatbot launcher should appear in the bottom-right corner.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Developer Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
