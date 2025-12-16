import { useState } from 'react';
import { Key, Copy, Check, HelpCircle, X, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

// This chatbot ID should ideally come from the user's data or configuration.
// For now, using a placeholder or we can ask the user to input it if it differs per user.
// The user request implied getting it from the chatbot ID in the curl command.
const DEMO_CHATBOT_ID = "056389c8-7268-4e75-b7ca-9ab69f488b91";

const getEmbedCode = (chatbotId: string) => `<iframe
  src="${window.location.origin}/chatbot-widget/${chatbotId}"
  style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; z-index: 999999;"
  title="Chatbot"
></iframe>`;

export default function Credentials() {
  const embedCode = getEmbedCode(DEMO_CHATBOT_ID);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast.success('Embed code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
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
            <h1 className="text-3xl font-bold text-foreground">Credentials</h1>
          </div>
          <p className="text-muted-foreground">
            Get the embed code to integrate your chatbot
          </p>
        </div>

        {/* Embed Code */}
        <Card className="border border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Embed Code</CardTitle>
                <CardDescription>Copy and paste this code into your website</CardDescription>
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
          <CardContent className="space-y-4">
            <div className="relative">
              <pre className="bg-foreground text-background p-4 rounded-xl overflow-x-auto text-sm font-mono">
                <code>{embedCode}</code>
              </pre>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="absolute top-3 right-3 gap-2"
              >
                {copied ? (
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

            <div className="p-4 bg-secondary rounded-xl">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Note:</span> Replace{' '}
                <code className="px-1 py-0.5 bg-card rounded text-xs">pb_xxxx</code>{' '}
                with your actual project ID from the Data section.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Information */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg">API Information</CardTitle>
            <CardDescription>Your chatbot API details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">API Base URL</p>
                <p className="font-mono text-sm text-foreground">https://api.baapservices.com</p>
              </div>
              <div className="p-4 bg-secondary rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Project ID</p>
                <p className="font-mono text-sm text-foreground">pb_xxxx</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-lg border-0 shadow-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">How to Use Embed Code</CardTitle>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Copy the embed code</p>
                      <p className="text-sm text-muted-foreground">Click the copy button above to copy the script</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Paste into your website</p>
                      <p className="text-sm text-muted-foreground">
                        Add the script inside the <code className="px-1 py-0.5 bg-secondary rounded text-xs">&lt;head&gt;</code> tag of your HTML
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Refresh your page</p>
                      <p className="text-sm text-muted-foreground">The chatbot bubble will appear in the bottom right corner</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Full Documentation
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
