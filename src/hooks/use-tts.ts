"use client";

import { useState, useCallback, useRef } from "react";

interface UseTTSReturn {
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakWithBrowser = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        utterance.volume = 1.0;

        // Try to find a good English voice
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) =>
            v.name.includes("Google") &&
            v.name.includes("UK") &&
            v.lang.startsWith("en")
        );
        const english = voices.find((v) => v.lang.startsWith("en"));
        utterance.voice = preferred || english || null;

        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      });
    },
    []
  );

  const speak = useCallback(
    async (text: string): Promise<void> => {
      stop();
      setIsSpeaking(true);

      try {
        // Try ElevenLabs first
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          return new Promise((resolve) => {
            audio.onended = () => {
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
              resolve();
            };
            audio.onerror = () => {
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
              resolve();
            };
            audio.play().catch(() => {
              // Fallback to browser TTS
              speakWithBrowser(text).then(resolve);
            });
          });
        }
      } catch {
        // ElevenLabs unavailable
      }

      // Fallback: browser TTS
      await speakWithBrowser(text);
    },
    [stop, speakWithBrowser]
  );

  return { isSpeaking, speak, stop };
}
