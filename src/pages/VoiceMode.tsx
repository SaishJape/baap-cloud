import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type SpeechRecognitionType =
  InstanceType<NonNullable<typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition>>;

export default function VoiceMode() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const recognitionActiveRef = useRef(false);

  useEffect(() => {
    const API = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!API) {
      toast.error('Speech Recognition not supported');
      return;
    }

    const recognition = new API();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      speak(text);
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;
      setIsListening(false);

      if (isConnected) {
        setTimeout(() => {
          if (!recognitionActiveRef.current) {
            try {
              recognition.start();
              recognitionActiveRef.current = true;
              setIsListening(true);
            } catch { }
          }
        }, 400);
      }
    };

    recognition.onerror = (e: any) => {
      recognitionActiveRef.current = false;
      setIsListening(false);

      if (['no-speech', 'aborted', 'network'].includes(e.error)) return;

      if (e.error === 'not-allowed') {
        toast.error('Mic permission denied');
        setIsConnected(false);
      }
    };

    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, [isConnected]);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const toggleConnection = () => {
    if (!recognitionRef.current) return;

    if (isConnected) {
      recognitionActiveRef.current = false;
      recognitionRef.current.stop();
      window.speechSynthesis.cancel();
      setIsListening(false);
      setIsSpeaking(false);
      setIsConnected(false);
    } else {
      try {
        recognitionRef.current.start();
        recognitionActiveRef.current = true;
        setIsListening(true);
        setIsConnected(true);
      } catch { }
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6">
      <Volume2 className={isSpeaking ? 'animate-pulse' : ''} />
      <Button onClick={toggleConnection} variant={isConnected ? 'destructive' : 'default'}>
        {isConnected ? <PhoneOff /> : <Phone />}
      </Button>
      <Button variant="outline">
        {isListening ? <MicOff /> : <Mic />}
      </Button>
    </div>
  );
}
