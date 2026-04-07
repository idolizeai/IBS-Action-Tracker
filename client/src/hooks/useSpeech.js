import { useEffect, useCallback, useState, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export function useSpeech(onResult) {
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const userInitiatedRef = useRef(false);
  const manualStopRef = useRef(false);

  const {
    interimTranscript,
    finalTranscript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  // Log every state change for debugging
  useEffect(() => {
    console.log('📊 SpeechRecognition State:', {
      listening,
      isStarting,
      userInitiated: userInitiatedRef.current,
      manualStop: manualStopRef.current,
      error,
      interimTranscript: interimTranscript?.length || 0,
      finalTranscript: finalTranscript?.length || 0,
      browserSupportsSpeechRecognition,
    });
  }, [listening, isStarting, error, interimTranscript, finalTranscript, browserSupportsSpeechRecognition]);

  // When speech recognition produces a final result, pass it to the parent
  useEffect(() => {
    if (!finalTranscript) return;
    console.log('📝 Final transcript received:', finalTranscript);
    onResult(finalTranscript);
    resetTranscript();
  }, [finalTranscript, onResult, resetTranscript]);

  // Auto-restart ONLY if user previously started it AND didn't manually stop
  useEffect(() => {
    // Don't auto-start on page load - only restart if user had previously started
    if (!userInitiatedRef.current) return;
    
    // If user manually stopped, don't restart
    if (manualStopRef.current) return;
    
    // If already starting or already listening, don't restart
    if (isStarting || listening) return;
    
    // If browser doesn't support it, don't restart
    if (!browserSupportsSpeechRecognition) return;

    console.log('🔄 Auto-restarting speech recognition (Chrome stopped it due to silence)...');
    SpeechRecognition.startListening({
      continuous: true,
      language: 'en-US',
      interimResults: true,
    }).catch(err => {
      console.error('❌ Auto-restart failed:', err);
      setError('Speech recognition failed to restart. Please click the mic icon again.');
    });
  }, [listening, isStarting, browserSupportsSpeechRecognition]);

  const start = useCallback(async () => {
    console.log('🎤 >>> START requested by user');

    if (isStarting) {
      console.log('⚠️ Already starting, ignoring...');
      return;
    }

    if (listening) {
      console.log('⚠️ Already listening, ignoring...');
      return;
    }

    setIsStarting(true);
    setError(null);
    resetTranscript();
    manualStopRef.current = false;
    userInitiatedRef.current = true; // Mark that user initiated this

    try {
      // 1. Check browser support
      if (!browserSupportsSpeechRecognition) {
        throw new Error('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      }
      console.log('✅ Browser supports speech recognition');

      // 2. Request microphone permission (required for mobile browsers)
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      console.log('✅ Microphone permission granted');
      stream.getTracks().forEach(track => track.stop());

      // 3. Start speech recognition
      console.log('🎤 Calling SpeechRecognition.startListening()...');
      await SpeechRecognition.startListening({
        continuous: true,
        language: 'en-US',
        interimResults: true,
      });

      console.log('✅ Speech recognition started successfully - NOW LISTENING');

    } catch (err) {
      console.error('❌ Microphone error:', err);
      setError(err.message || 'Failed to start microphone');
      manualStopRef.current = true;
      userInitiatedRef.current = false;
      try {
        SpeechRecognition.stopListening();
      } catch {}
    } finally {
      setIsStarting(false);
    }
  }, [browserSupportsSpeechRecognition, isStarting, listening, resetTranscript]);

  const stop = useCallback(() => {
    console.log('🛑 >>> STOP requested by user');
    manualStopRef.current = true; // Mark as manually stopped so auto-restart won't fire
    userInitiatedRef.current = false; // Reset user initiation
    SpeechRecognition.stopListening();
    resetTranscript();
    setIsStarting(false);
    setError(null);
    console.log('✅ Speech recognition STOPPED');
  }, [resetTranscript]);

  const toggle = useCallback(async () => {
    console.log('🔄 Toggle clicked. Current state: listening =', listening);
    if (listening) {
      stop();
    } else {
      await start();
    }
  }, [listening, start, stop]);

  return {
    listening,
    toggle,
    supported: browserSupportsSpeechRecognition,
    interimTranscript,
    error,
    isStarting,
  };
}
