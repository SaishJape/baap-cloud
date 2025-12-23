import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle, X, Send, User, Bot, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/services/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

type SpeechRecognitionType = InstanceType<
    NonNullable<typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition>
>;

export default function ChatbotWidget() {
    const { chatbotId } = useParams();
    const [isOpen, setIsOpen] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Hi there! How can I help you today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<SpeechRecognitionType | null>(null);
    const voiceModeRef = useRef(false);
    const voiceRequestInFlightRef = useRef(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const [lastError, setLastError] = useState<string | null>(null);

    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) return;

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event) => {
            if (!event.results[0].isFinal) return;
            const transcript = event.results[0][0].transcript.trim();
            if (!transcript) return;

            setLastError(null);

            if (voiceModeRef.current && !voiceRequestInFlightRef.current) {
                recognition.stop();
                voiceRequestInFlightRef.current = true;
                void askAndHandleAnswer({ question: transcript, mode: 'voice' }).finally(() => {
                    voiceRequestInFlightRef.current = false;
                });
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            // Restart conversation loop if active, idle, and not speaking.
            if (voiceModeRef.current && !voiceRequestInFlightRef.current && !window.speechSynthesis.speaking) {
                setTimeout(() => {
                    if (voiceModeRef.current && !voiceRequestInFlightRef.current && !window.speechSynthesis.speaking) {
                        try {
                            recognition.start();
                            setIsListening(true);
                            setLastError(null);
                        } catch (e) {
                            // Ignore start errors (e.g. already started)
                        }
                    }
                }, 300);
            }
        };

        recognition.onerror = (event: any) => {
            setIsListening(false);
            const error = event.error;

            // Ignore benign errors in continuous mode
            if (error === 'no-speech' || error === 'aborted' || error === 'network') {
                return;
            }

            if (error === 'not-allowed' || error === 'permission-denied') {
                const msg = 'Microphone access denied. Please allow permissions.';
                setLastError(msg);
                toast.error(msg);
                stopVoiceMode();
                return;
            }

            const msg = `Mic Error: ${error}`;
            setLastError(msg);
            // toast.error(msg); // Optional: reduce toast spam if using inline error
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            recognitionRef.current = null;
        };
    }, []);

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const stopListening = () => {
        try {
            recognitionRef.current?.stop();
        } catch { }
        setIsListening(false);
    };

    const stopVoiceMode = () => {
        voiceModeRef.current = false;
        setIsVoiceMode(false);
        stopSpeaking();
        stopListening();
    };

    const speak = (text: string) => {
        stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(text);

        // Get all voices and prefer high-quality Indian English voices
        // Prioritize "Natural" voices (available in Edge)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
            voices.find(v => v.name.includes('Natural') && v.name.includes('India')) ||
            voices.find(v => v.name.includes('Google') && v.name.includes('India')) ||
            voices.find(v => v.name.includes('Microsoft Heera')) ||
            voices.find(v => v.name.includes('Microsoft Ravi')) ||
            voices.find(v => v.lang === 'en-IN') ||
            voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Tuned for Natural voices
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1;       // full volume

        // Natural pauses between sentences
        utterance.text = text.replace(/\.(?=\s|$)/g, ". "); // add space after period

        utterance.onstart = () => {
            setIsSpeaking(true);
            stopListening(); // stop mic while speaking
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            if (voiceModeRef.current) {
                setTimeout(() => {
                    try {
                        recognitionRef.current?.start();
                        setIsListening(true);
                    } catch { }
                }, 300); // small thinking pause
            }
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    };



    const askAndHandleAnswer = async ({
        question,
        mode,
    }: {
        question: string;
        mode: 'text' | 'voice';
    }) => {
        if (!question.trim() || isLoading) return;

        const trimmedQuestion = question.trim();

        if (mode === 'text') {
            const userMessage: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: trimmedQuestion,
            };
            setMessages((prev) => [...prev, userMessage]);
        }
        if (mode === 'text') setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/chat/chat/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify({
                    chatbot_id: chatbotId,
                    question: mode === 'voice'
                        ? `${trimmedQuestion}\n\n(Reply in a calm, friendly, natural human tone. Use simple words. Speak like a helpful Indian English assistant.)`
                        : trimmedQuestion
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

            const data = await response.json();

            // Backend can return { answer } or { data: { answer } }
            const answer =
                (typeof data?.data?.answer === 'string' && data.data.answer.trim()) ||
                (typeof data?.answer === 'string' && data.answer.trim()) ||
                "I'm sorry, I couldn't understand that.";

            if (mode === 'text') {
                // Rule: typed Send => show as text only (no voice auto-play)
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: answer,
                };
                setMessages((prev) => [...prev, botMessage]);
            } else {
                // Rule: voice => speak only (do NOT display assistant text)
                speak(answer);
            }
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Failed to send message');

            if (mode === 'text') {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: "Sorry, I'm having trouble connecting right now.",
                    },
                ]);
            } else {
                speak("Sorry, I'm having trouble connecting right now.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        await askAndHandleAnswer({ question: inputValue, mode: 'text' });
    };

    const startVoiceMode = () => {
        if (!recognitionRef.current) {
            toast.error('Speech recognition not supported');
            return;
        }

        voiceModeRef.current = true;
        setIsVoiceMode(true);

        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch {
            setIsListening(false);
        }
    };

    // If used inside an iframe, we might want the background to be transparent
    // handled via standard CSS in index.html or body style, but here we control the widget container.

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-4 font-sans">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[350px] sm:w-[400px] h-[500px] shadow-xl border-border animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col">
                    <CardHeader className="p-4 border-b bg-primary text-primary-foreground rounded-t-xl flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <CardTitle className="text-base font-medium">{isVoiceMode ? 'Voice Mode' : 'Chat Support'}</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary-foreground hover:bg-primary-foreground/20 w-8 h-8"
                            onClick={() => {
                                stopVoiceMode();
                                setIsOpen(false);
                            }}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden bg-background">
                        {isVoiceMode ? (
                            <div className="h-full flex flex-col items-center justify-center gap-6 p-6">
                                <div
                                    className={cn(
                                        "w-28 h-28 rounded-full flex items-center justify-center border transition-all duration-300",
                                        isListening ? "bg-primary/10 border-primary/30 scale-110" : "bg-secondary border-border",
                                        lastError ? "border-destructive/50 bg-destructive/10" : ""
                                    )}
                                >
                                    <Mic className={cn("w-12 h-12",
                                        lastError ? "text-destructive" : isListening ? "text-primary animate-pulse" : "text-muted-foreground"
                                    )} />
                                </div>

                                <div className="text-center space-y-1">
                                    {lastError ? (
                                        <p className="text-sm text-destructive font-medium px-2 animate-in fade-in slide-in-from-bottom-1">{lastError}</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground animate-in fade-in">
                                            {isListening ? 'Listening… speak now' : isSpeaking ? 'Speaking…' : 'Ready'}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Voice responses only (no text shown)
                                    </p>
                                </div>

                                <Button
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={stopVoiceMode}
                                >
                                    <Square className="w-4 h-4" />
                                    Stop
                                </Button>
                            </div>
                        ) : (
                            <ScrollArea className="h-full p-4">
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex w-full gap-2",
                                                msg.role === 'user' ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            {msg.role === 'assistant' && (
                                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                                    <Bot className="w-4 h-4 text-secondary-foreground" />
                                                </div>
                                            )}
                                            <div
                                                className={cn(
                                                    "rounded-2xl px-4 py-2 max-w-[80%] text-sm",
                                                    msg.role === 'user'
                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                        : "bg-secondary text-secondary-foreground rounded-tl-none"
                                                )}
                                            >
                                                {msg.content}
                                            </div>
                                            {msg.role === 'user' && (
                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                    <User className="w-4 h-4 text-primary-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex w-full gap-2 justify-start">
                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                                <Bot className="w-4 h-4 text-secondary-foreground" />
                                            </div>
                                            <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-tl-none px-4 py-2 text-sm flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce"></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>

                    <CardFooter className="p-4 border-t bg-background">
                        {isVoiceMode ? (
                            <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                                <span>{isListening ? 'Listening…' : isSpeaking ? 'Speaking…' : 'Stopped'}</span>
                                <Button variant="outline" size="sm" onClick={stopVoiceMode}>
                                    Back to chat
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                                <Input
                                    placeholder="Type your message..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="flex-1"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={startVoiceMode}
                                    disabled={isLoading}
                                    aria-label="Open voice mode"
                                    title="Voice"
                                >
                                    <Mic className="w-4 h-4" />
                                </Button>
                                <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        )}
                    </CardFooter>
                </Card>
            )}

            {/* Launcher Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 p-0 bg-primary text-primary-foreground"
                >
                    <MessageCircle className="w-8 h-8" />
                </Button>
            )}
        </div>
    );
}
