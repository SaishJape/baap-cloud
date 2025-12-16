import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, Bot, User, Loader2, Phone, PhoneOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import '@/types/speech.d.ts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type SpeechRecognitionType = InstanceType<NonNullable<typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition>>;

export default function VoiceMode() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error('Voice recognition error');
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!ttsEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses = [
      "That's a great question! Based on the data I have, I can help you with that.",
      "I understand what you're looking for. Let me provide you with some information.",
      "Thanks for asking! Here's what I found that might be helpful.",
    ];

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
    speakText(assistantMessage.content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleConnection = () => {
    setIsConnected(!isConnected);
    toast.success(isConnected ? 'Disconnected from voice chat' : 'Connected to voice chat');
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] flex flex-col w-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Voice Mode</h1>
            <p className="text-sm text-muted-foreground">Chat using voice or text</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={ttsEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="gap-2"
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">TTS</span>
            </Button>
            <Button
              variant={isConnected ? "destructive" : "default"}
              size="sm"
              onClick={toggleConnection}
              className="gap-2"
            >
              {isConnected ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              <span className="hidden sm:inline">{isConnected ? 'End' : 'Connect'}</span>
            </Button>
          </div>
        </div>

        {/* Main Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden border border-border bg-card">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  message.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2",
                  message.role === 'user'
                    ? "bg-primary border-primary"
                    : "bg-background border-border"
                )}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <Bot className="w-5 h-5 text-foreground" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[75%] p-4 rounded-2xl",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-secondary-foreground rounded-bl-sm"
                )}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={cn(
                    "text-xs mt-2 opacity-60"
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-background border-2 border-border flex items-center justify-center">
                  <Bot className="w-5 h-5 text-foreground" />
                </div>
                <div className="bg-secondary p-4 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Indicator */}
          {(isListening || isSpeaking) && (
            <div className="px-4 py-2 border-t border-border bg-secondary/50">
              <div className="flex items-center justify-center gap-3">
                {isListening && (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <div className="relative">
                      <Mic className="w-5 h-5 text-destructive" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-ping" />
                    </div>
                    <span>Listening...</span>
                    <div className="flex gap-0.5">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-foreground rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 16 + 8}px`,
                            animationDelay: `${i * 100}ms`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Volume2 className="w-5 h-5 animate-pulse" />
                    <span>Speaking...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-3 items-center">
              {/* Mic Button */}
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={toggleListening}
                className={cn(
                  "shrink-0 w-12 h-12 rounded-full relative transition-all",
                  isListening && "ring-4 ring-destructive/30"
                )}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>

              {/* Text Input */}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                className="flex-1 h-12 text-base"
                disabled={isListening}
              />

              {/* Send Button */}
              <Button
                variant="default"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="shrink-0 w-12 h-12 rounded-full"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}