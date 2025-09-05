import { useState, useEffect, useRef } from 'react';

// FIX: Define the SpeechRecognition interface to provide type safety for the Web Speech API.
// This interface is not part of standard TypeScript DOM typings.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onend: () => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onEnd: () => void;
  onError: (error: any) => void;
}

// FIX: Cast window to `any` to access non-standard browser APIs and provide a type for the constructor.
// Renamed to avoid shadowing the interface name.
const SpeechRecognitionAPI: { new(): SpeechRecognition } | undefined =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSupported = !!SpeechRecognitionAPI;

export const useSpeechRecognition = ({ onResult, onEnd, onError }: SpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');

  // Effect for cleaning up on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const resetTranscript = () => {
    finalTranscriptRef.current = '';
  };

  const startListening = () => {
    if (isListening || !isSupported || !SpeechRecognitionAPI) {
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // en-IN is often better for Hinglish

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }
      onResult((finalTranscriptRef.current + interimTranscript).trim());
    };
    
    recognition.onend = () => {
      setIsListening(false);
      onEnd();
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      onError(event.error);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return { isListening, startListening, stopListening, isSupported, resetTranscript };
};