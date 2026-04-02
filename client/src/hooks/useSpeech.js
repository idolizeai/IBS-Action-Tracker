import { useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export function useSpeech(onResult) {
  const {
    interimTranscript,
    finalTranscript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  // When a final result arrives, pass it up then clear
  useEffect(() => {
    if (!finalTranscript) return;
    onResult(finalTranscript);
    resetTranscript();
  }, [finalTranscript]); // eslint-disable-line

  function start() {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  }

  function stop() {
    SpeechRecognition.stopListening();
  }

  function toggle() {
    listening ? stop() : start();
  }

  return {
    listening,
    toggle,
    supported: browserSupportsSpeechRecognition,
    interimTranscript, // live words as you speak
  };
}
