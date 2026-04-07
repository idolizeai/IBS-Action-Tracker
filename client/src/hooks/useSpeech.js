import { useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export function useSpeech(onResult) {
  const {
    interimTranscript,
    finalTranscript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  // Append final transcript to title when speech is detected
  useEffect(() => {
    if (finalTranscript && onResult) {
      onResult(finalTranscript);
      resetTranscript();
    }
  }, [finalTranscript, onResult, resetTranscript]);

  const start = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Let the library handle microphone permission internally
    SpeechRecognition.startListening({
      continuous: true,
      language: 'en-US',
      interimResults: true,
    });
  }, [browserSupportsSpeechRecognition]);

  const stop = useCallback(() => {
    SpeechRecognition.stopListening();
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  return {
    listening,
    toggle,
    supported: browserSupportsSpeechRecognition,
    interimTranscript,
  };
}
