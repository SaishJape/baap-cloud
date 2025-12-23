import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, X, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import '@/types/speech.d.ts';
import { useAuth } from '@/contexts/AuthContext';
import { chatbotService, Chatbot } from '@/services/chatbotService';
import { API_BASE_URL } from '@/services/api';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function VoiceMode() {
  const { userId, clientId } = useAuth();

  // Selection State
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);

  // Voice State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const transcriptRef = useRef('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);
  const sessionActiveRef = useRef(false);
  // NEW: Ref to track selected chatbot to avoid stale closures in event listeners
  const selectedChatbotRef = useRef<Chatbot | null>(null);

  // Fetch Chatbots
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

  // Sync ref
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    selectedChatbotRef.current = selectedChatbot;
  }, [selectedChatbot]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // KEEP LISTENING until we manually stop
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        // Build full transcript from all results
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        // Update UI
        setTranscript(currentTranscript);
        transcriptRef.current = currentTranscript;

        // Reset Silence Timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Only set timer if we have some text
        if (currentTranscript.trim()) {
          silenceTimerRef.current = setTimeout(() => {
            const finalInput = transcriptRef.current.trim();
            // Check if we should submit (silence detected)
            if (finalInput && !isSubmittingRef.current && sessionActiveRef.current) {
              performSubmit(finalInput);
            }
          }, 3000); // 3s silence to trigger submit
        }
      };

      recognition.onend = () => {
        // If recognition stops unexpectedly (e.g. browser engine limit), restart it
        // UNLESS we are explicitly processing/speaking or user stopped it.
        if (sessionActiveRef.current && !isSubmittingRef.current && !window.speechSynthesis.speaking) {
          console.log("Recognition ended unexpectedly, restarting...");
          try { recognition.start(); } catch { }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Error:", event.error);
        if (event.error === 'not-allowed') {
          stopConversation();
          toast.error("Microphone access denied.");
        }
        // benign errors will hit onend
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopConversation();
    };
  }, []);

  const isStopCommand = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z ]/g, '');
    return cleaned === 'stop' || cleaned === 'stop listening' || cleaned === 'exit' || cleaned === 'cancel';
  };

  const startConversation = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported");
      return;
    }
    sessionActiveRef.current = true;
    setVoiceState('listening');
    setTranscript('');
    setMessages([]);
    isSubmittingRef.current = false;

    try {
      recognitionRef.current.start();
      toast.success("Listening...");
    } catch (e) {
      console.error(e);
      // It might be already started, which is fine
    }
  };

  const stopConversation = () => {
    sessionActiveRef.current = false;
    setVoiceState('idle');
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    try { recognitionRef.current?.stop(); } catch { }
    synthRef.current.cancel();
    setTranscript('');
    isSubmittingRef.current = false;
    toast.info("Conversation ended");
  };

  const handleBack = () => {
    stopConversation();
    setSelectedChatbot(null);
  };

  const performSubmit = async (inputText: string) => {
    // Check if we have a valid chatbot selected using the Ref to avoid stale closures
    const currentChatbot = selectedChatbotRef.current;
    if (!currentChatbot) {
      console.error("No chatbot selected");
      return;
    }

    // 1. Stop Listening logic
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    isSubmittingRef.current = true;
    try { recognitionRef.current?.stop(); } catch { } // Stop mic while processing

    // 2. Check Stop Command
    if (isStopCommand(inputText)) {
      stopConversation();
      return;
    }

    setVoiceState('processing');
    // Add User Message
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: inputText }]);

    try {
      // 3. API Call
      const response = await fetch(`${API_BASE_URL}/chat/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbot_id: currentChatbot.id,
          question: `${inputText}\n\n(Reply in a calm, friendly, natural human tone. Use simple words. Speak like a helpful Indian English assistant. Keep it warm and clear.)`
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      const answer =
        (typeof data?.data?.answer === 'string' && data.data.answer.trim()) ||
        (typeof data?.answer === 'string' && data.answer.trim()) ||
        "I didn't catch that.";

      // Add Bot Message
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: answer }]);

      // 4. Speak
      speak(answer);

    } catch (error) {
      console.error(error);
      toast.error("Failed to connect");
      speak("Sorry, I'm having trouble connecting.");
    }
  };

  const speak = (text: string) => {
    synthRef.current.cancel();

    if (!ttsEnabled) {
      setVoiceState('speaking');
      setTimeout(() => {
        finishSpeaking();
      }, 2000);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0; // Natural pitch
    // Voice Selection (Same as before)
    const voices = synthRef.current.getVoices();
    const preferredVoice =
      voices.find(v => v.name.includes("Natural") && v.name.includes("India")) ||
      voices.find(v => v.name.includes("Google") && v.name.includes("India")) ||
      voices.find(v => v.name.includes("Microsoft Heera")) ||
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.name.includes("English"));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend = () => finishSpeaking();
    utterance.onerror = () => finishSpeaking();

    synthRef.current.speak(utterance);
  };

  const finishSpeaking = () => {
    // 5. Restart Listening
    if (sessionActiveRef.current) {
      setVoiceState('listening');
      setTranscript('');
      isSubmittingRef.current = false;
      // Small delay to ensure synthesis is fully cleared
      setTimeout(() => {
        if (sessionActiveRef.current) {
          try { recognitionRef.current?.start(); } catch { }
        }
      }, 200);
    }
  };

  return (
    <DashboardLayout>
      {!selectedChatbot ? (
        // SELECTION VIEW
        <div className="space-y-8 w-full animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Voice Test Mode</h1>
            </div>
            <p className="text-muted-foreground">Select a chatbot to test voice interactions in real-time.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : chatbots.length === 0 ? (
            <Card className="border border-border">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No Chatbots Found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">Create a chatbot to start testing voice mode.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {chatbots.map((chatbot) => (
                <Card key={chatbot.id} className="border border-border hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={chatbot.status === 'ready' ? 'default' : 'secondary'}>
                        {chatbot.status}
                      </Badge>
                    </div>
                    <CardTitle>{chatbot.title}</CardTitle>
                    <CardDescription className="font-mono text-xs truncate">ID: {chatbot.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full gap-2" onClick={() => setSelectedChatbot(chatbot)}>
                      <Phone className="w-4 h-4" />
                      Test Voice Mode
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ACTIVE VOICE VIEW
        <div className="flex flex-col h-full w-full relative">
          <Button
            variant="ghost"
            className="absolute top-4 left-4 z-50 gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Button>

          <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] w-full bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">

            {/* Visualizer Area */}
            <div className="relative flex items-center justify-center w-64 h-64 mb-12">
              {/* Idle State */}
              {voiceState === 'idle' && (
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <MicOff className="w-12 h-12 text-muted-foreground" />
                </div>
              )}

              {/* Listening State - Pulsing Orb */}
              {voiceState === 'listening' && (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping [animation-duration:2s]" />
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping [animation-duration:3s]" />
                  <div className="w-40 h-40 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(var(--primary),0.5)] transition-all duration-300 transform scale-105">
                    <Mic className="w-16 h-16 text-primary-foreground animate-bounce" />
                  </div>
                  <p className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-lg font-medium animate-pulse text-foreground/80 whitespace-nowrap">
                    {transcript || "Listening..."}
                  </p>
                </div>
              )}

              {/* Processing State - Spinner */}
              {voiceState === 'processing' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <p className="text-lg font-medium text-muted-foreground animate-pulse">Thinking...</p>
                </div>
              )}

              {/* Speaking State - Audio Wave Simulation */}
              {voiceState === 'speaking' && (
                <div className="flex flex-col items-center gap-8">
                  <div className="flex items-center gap-2 h-32">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-4 bg-primary rounded-full animate-[pulse_1s_ease-in-out_infinite]"
                        style={{
                          height: '30%',
                          animationDelay: `${i * 0.1}s`,
                          animationName: 'music-bar-weka'
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-lg font-medium text-foreground/80 max-w-md text-center px-4">
                    {messages[messages.length - 1]?.content}
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 z-10">
              {voiceState === 'idle' ? (
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full shadow-xl hover:scale-105 transition-all text-xl"
                  onClick={startConversation}
                >
                  <Phone className="w-8 h-8" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-16 w-16 rounded-full shadow-xl hover:scale-105 transition-all"
                  onClick={stopConversation}
                >
                  <X className="w-8 h-8" />
                </Button>
              )}

              <Button
                size="icon"
                variant="secondary"
                className="rounded-full shadow-md"
                onClick={() => setTtsEnabled(!ttsEnabled)}
              >
                {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
            </div>

            <div className="absolute bottom-8 text-sm text-muted-foreground flex flex-col items-center gap-1">
              <p>{voiceState === 'listening' ? "Auto-submits after silence • Say 'Stop' to end" : "Tap the phone to start"}</p>
              <p className="opacity-70 text-xs">Connected to: {selectedChatbot.title}</p>
            </div>

            {/* CSS Keyframes */}
            <style>{`
                  @keyframes music-bar-weka {
                      0%, 100% { height: 30%; }
                      50% { height: 100%; }
                  }
            `}</style>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
