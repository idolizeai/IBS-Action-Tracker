import { useEffect, useCallback, useState, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
);

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE: Use the raw native SpeechRecognition API.
// react-speech-recognition wraps it in React state which causes stale-closure
// bugs in the restart loop on mobile. The native API lets us wire onend/onerror
// directly to refs — no stale values, no missed restarts.
// ─────────────────────────────────────────────────────────────────────────────
function useMobileSpeech(onResult) {
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  const userWantsMicOn = useRef(false);
  const isRunningRef = useRef(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const startNativeFnRef = useRef(null); // forward-ref so onend can call it
  const retryTimerRef = useRef(null);
  const lastFinalResultAt = useRef(0); // timestamp of last final result

  // Keep onResult ref fresh without re-creating recognition
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  // Create the native recognition instance once on mount
  useEffect(() => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) return;

    const recognition = new SpeechAPI();
    // continuous=true: keeps the session alive after each utterance so we don't
    // get the audible mic click/pop on every sentence. Mobile Chrome respects this
    // for delivering results — it only terminates on prolonged silence (handled by onend).
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('📱 [Mobile] onstart');
      isRunningRef.current = true;
      setListening(true);
      setIsStarting(false);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += text;
        else interim += text;
      }
      if (interim) setInterimTranscript(interim);
      if (final) {
        console.log('📝 [Mobile] Final:', final);
        lastFinalResultAt.current = Date.now(); // track when speech was last processed
        setInterimTranscript('');
        onResultRef.current(final);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ [Mobile] onerror:', event.error);
      isRunningRef.current = false;
      setListening(false);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        userWantsMicOn.current = false;
        setIsStarting(false);
        setError('Microphone permission denied. Please allow mic access and try again.');
        return;
      }

      if (event.error === 'aborted' || !userWantsMicOn.current) {
        setIsStarting(false);
        return;
      }

      // For no-speech, network, audio-capture etc. — schedule a restart
      console.log('🔄 [Mobile] onerror restart in 400ms…');
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => startNativeFnRef.current?.(), 400);
    };

    recognition.onend = () => {
      console.log('📱 [Mobile] onend. userWantsMicOn:', userWantsMicOn.current);
      isRunningRef.current = false;
      setListening(false);
      setInterimTranscript('');

      if (!userWantsMicOn.current) return;

      // If onend happened almost immediately after a final result (<1.5s),
      // the browser ended cleanly post-utterance. Restart quickly (50ms).
      // If it's a long silence timeout, restart with a short delay (150ms).
      const msSinceFinal = Date.now() - lastFinalResultAt.current;
      const delay = msSinceFinal < 1500 ? 50 : 150;
      console.log(`🔄 [Mobile] onend restart in ${delay}ms (msSinceFinal=${msSinceFinal})…`);
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => startNativeFnRef.current?.(), delay);
    };

    recognitionRef.current = recognition;
    return () => {
      clearTimeout(retryTimerRef.current);
      try { recognition.abort(); } catch { }
      recognitionRef.current = null;
    };
  }, []); // run once

  // The actual native start — called by user action AND by onend/onerror
  const startNative = useCallback(() => {
    if (!userWantsMicOn.current) return;
    if (isRunningRef.current) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;

    console.log('📱 [Mobile] Calling recognition.start()');
    try {
      recognition.start();
    } catch (err) {
      console.error('❌ [Mobile] recognition.start() threw:', err);
      isRunningRef.current = false;
      // InvalidStateError means it's already started — clear the flag and wait
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => startNativeFnRef.current?.(), 500);
    }
  }, []);

  // Keep the forward-ref up to date
  useEffect(() => { startNativeFnRef.current = startNative; }, [startNative]);

  const start = useCallback(async () => {
    console.log('🎤 [Mobile] >>> START');
    if (!recognitionRef.current) {
      setError('Speech recognition not supported on this device.');
      return;
    }
    if (isRunningRef.current || isStarting) return;

    userWantsMicOn.current = true;
    setIsStarting(true);
    setError(null);
    clearTimeout(retryTimerRef.current);
    startNative();
  }, [isStarting, startNative]);

  const stop = useCallback(() => {
    console.log('🛑 [Mobile] >>> STOP');
    userWantsMicOn.current = false;
    clearTimeout(retryTimerRef.current);
    setListening(false);
    setIsStarting(false);
    setInterimTranscript('');
    setError(null);
    isRunningRef.current = false;
    try { recognitionRef.current?.abort(); } catch { }
  }, []);

  const toggle = useCallback(async () => {
    if (userWantsMicOn.current) stop();
    else await start();
  }, [start, stop]);

  const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

  return {
    // Show UI as "listening" whenever user wants it, even during the 100ms restart gap
    listening: userWantsMicOn.current ? (listening || isStarting) : false,
    toggle,
    stop,
    supported: !!SpeechAPI,
    interimTranscript,
    error,
    isStarting,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP: Use react-speech-recognition (works reliably on non-mobile browsers)
// ─────────────────────────────────────────────────────────────────────────────
function useDesktopSpeech(onResult) {
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const userWantsMicOn = useRef(false);
  const streamRef = useRef(null);

  const {
    interimTranscript,
    finalTranscript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  // Pass final transcript to parent
  useEffect(() => {
    if (!finalTranscript) return;
    console.log('📝 [Desktop] Final:', finalTranscript);
    onResult(finalTranscript);
    resetTranscript();
  }, [finalTranscript, onResult, resetTranscript]);

  // Auto-restart if Chrome silently stopped it (desktop silence timeout)
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;
    if (!userWantsMicOn.current) return;
    if (listening || isStarting) return;

    console.log('🔄 [Desktop] Auto-restart…');
    SpeechRecognition.startListening({ continuous: true, language: 'en-US', interimResults: true })
      .catch(err => {
        console.error('❌ [Desktop] Auto-restart failed:', err);
        setError('Mic stopped. Click the mic button to resume.');
      });
  }, [listening, isStarting, browserSupportsSpeechRecognition]);

  const killStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    console.log('🎤 [Desktop] >>> START');
    if (!browserSupportsSpeechRecognition) {
      setError('Speech recognition not supported. Use Chrome or Edge.');
      return;
    }
    if (isStarting || listening) return;

    setIsStarting(true);
    setError(null);
    resetTranscript();
    userWantsMicOn.current = true;

    try {
      // Grab a stream so killStream can turn off the browser mic indicator on close
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      } catch (e) {
        console.warn('⚠️ [Desktop] getUserMedia failed:', e);
      }

      await SpeechRecognition.startListening({
        continuous: true,
        language: 'en-US',
        interimResults: true,
      });
      console.log('✅ [Desktop] Listening');
    } catch (err) {
      console.error('❌ [Desktop] start() failed:', err);
      setError(err.message || 'Failed to start microphone');
      userWantsMicOn.current = false;
    } finally {
      setIsStarting(false);
    }
  }, [browserSupportsSpeechRecognition, isStarting, listening, resetTranscript]);

  const stop = useCallback(() => {
    console.log('🛑 [Desktop] >>> STOP');
    userWantsMicOn.current = false;
    SpeechRecognition.stopListening();
    resetTranscript();
    setIsStarting(false);
    setError(null);
    killStream();
  }, [resetTranscript, killStream]);

  const toggle = useCallback(async () => {
    if (userWantsMicOn.current) stop();
    else await start();
  }, [start, stop]);

  return {
    listening,
    toggle,
    stop,
    supported: browserSupportsSpeechRecognition,
    interimTranscript,
    error,
    isStarting,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public hook: routes to the right engine based on platform
// ─────────────────────────────────────────────────────────────────────────────
export function useSpeech(onResult) {
  const mobile = useMobileSpeech(onResult);
  const desktop = useDesktopSpeech(onResult);
  return isMobile ? mobile : desktop;
}
