import { useState, useEffect, useRef } from 'react';

// Preference order for high-quality voices. Lower index is better.
const VOICE_PREFERENCES = [
  'neural', 'google', 'microsoft' 
];

const getBestVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
  if (englishVoices.length === 0) return null;

  let bestVoice: SpeechSynthesisVoice = englishVoices[0];
  let bestRank = Infinity;

  for (const voice of englishVoices) {
    const nameLower = voice.name.toLowerCase();
    const rank = VOICE_PREFERENCES.findIndex(pref => nameLower.includes(pref));
    
    if (rank !== -1 && rank < bestRank) {
      bestRank = rank;
      bestVoice = voice;
    }
  }

  return bestVoice;
};


export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const selectedVoice = useRef<SpeechSynthesisVoice | null>(null);

  const isSupported = 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      selectedVoice.current = getBestVoice(availableVoices);
    };

    // Initial load and event listener
    handleVoicesChanged();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);


  const speak = (text: string) => {
    if (!isSupported || isSpeaking) return;
    
    // Ensure any previous speech is stopped before starting new speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice.current) {
      utterance.voice = selectedVoice.current;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e);
        setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const cancel = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return { isSpeaking, speak, cancel, isSupported };
};
