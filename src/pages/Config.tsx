import { useState } from 'react';
import { Settings, Sparkles, Bot, Key, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ModelType = 'free' | 'gemini';

export default function Config() {
  const [selectedModel, setSelectedModel] = useState<ModelType>('free');
  const [apiKey, setApiKey] = useState('');
  const [agentMode, setAgentMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (selectedModel === 'gemini' && !apiKey) {
      toast.error('Please enter your Gemini API key');
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Configuration saved successfully!');
    setIsSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Model Configuration</h1>
          </div>
          <p className="text-muted-foreground">
            Choose your AI model and configure settings
          </p>
        </div>

        {/* Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free Model */}
          <Card
            className={cn(
              "cursor-pointer transition-all border-2",
              selectedModel === 'free'
                ? "border-primary shadow-elevated"
                : "border-transparent hover:border-primary/30"
            )}
            onClick={() => setSelectedModel('free')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Free Model</h3>
                    {selectedModel === 'free' && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sentence Transformers
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                    No API Key Required
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gemini Model */}
          <Card
            className={cn(
              "cursor-pointer transition-all border-2",
              selectedModel === 'gemini'
                ? "border-accent shadow-elevated"
                : "border-transparent hover:border-accent/30"
            )}
            onClick={() => setSelectedModel('gemini')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Gemini</h3>
                    {selectedModel === 'gemini' && (
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                        <Check className="w-4 h-4 text-accent-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Google's Advanced AI
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-accent/10 text-accent text-xs rounded-md">
                    Premium Quality
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model-specific settings */}
        {selectedModel === 'free' ? (
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 p-4 bg-secondary rounded-xl">
                <Bot className="w-5 h-5 text-muted-foreground" />
                <p className="text-foreground">
                  Sentence Transformers is active — <span className="font-medium">No API Key Required</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg">Gemini Settings</CardTitle>
              <CardDescription>Configure your Gemini API integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Gemini API Key
                </label>
                <Input
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from Google AI Studio
                </p>
              </div>

              {/* Agent Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Agent Mode</p>
                    <p className="text-sm text-muted-foreground">Enable advanced AI agent capabilities</p>
                  </div>
                </div>
                <button
                  onClick={() => setAgentMode(!agentMode)}
                  className={cn(
                    "w-14 h-8 rounded-full transition-all duration-300 relative",
                    agentMode ? "bg-accent" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-6 h-6 bg-card rounded-full shadow-md transition-all duration-300",
                      agentMode ? "left-7" : "left-1"
                    )}
                  />
                </button>
              </div>

              {agentMode && (
                <div className="flex items-center gap-3 p-4 bg-accent/10 border border-accent/20 rounded-xl animate-fade-in">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <p className="text-foreground">
                    <span className="font-medium">Agent Mode Active</span> — Your chatbot will use Gemini Agent
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <Button
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Configuration'
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
}
