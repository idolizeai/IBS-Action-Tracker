import { useEffect, useCallback, useState, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
);

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE: Use the raw native SpeechRecognition API directly.
//
// Why not react-speech-recognition on mobile?
//   - The library wraps results in React state → stale closures in restart loops
//
// Why create a fresh instance on every start?
//   - With continuous=true, the browser accumulates all results in event.results[]
//   - Re-using the same object after abort() causes old final results to re-fire
//     through the same onresult handler → words get typed 4x, 5x, etc.
//   - A fresh instance always starts with an empty results array
//
// Why sessionId?
//   - Restart is asynchronous (setTimeout). A stale "onend" callback from the
//     previous session might fire after the user pressed Stop and then Start again.
//     sessionId lets us discard events from the wrong session instantly.
// ─────────────────────────────────────────────────────────────────────────────
function useMobileSpeech(onResult) {
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  const userWantsMicOn = useRef(false);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const retryTimerRef = useRef(null);
  const sessionIdRef = useRef(0); // increment on every user-initiated start

  // Keep onResult ref fresh so handlers never go stale
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  // ─── Core: create a fresh instance and start it ──────────────────────────
  // `mySessionId` lets every callback know which "generation" they belong to.
  const makeAndStart = useCallback((mySessionId) => {
    // Bail if user already pressed stop, or this is a stale restart
    if (!userWantsMicOn.current) return;
    if (mySessionId !== sessionIdRef.current) return;

    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) {
      setError('Speech recognition not supported on this device.');
      return;
    }

    // Tear down old instance silently
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.abort(); } catch { }
      recognitionRef.current = null;
    }

    // Fresh instance = empty results[], no re-delivery of past transcripts
    const recognition = new SpeechAPI();
    recognition.continuous = true;   // Keep session open between sentences
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      if (mySessionId !== sessionIdRef.current) return;
      console.log(`📱 [Mobile] Session ${mySessionId} started`);
      setListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      if (mySessionId !== sessionIdRef.current) return;
      let interim = '';
      let final = '';
      // event.resultIndex = index of the newest result — only process from there
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += text;
        else interim += text;
      }
      if (interim) setInterimTranscript(interim);
      if (final) {
        console.log(`📝 [Mobile] Session ${mySessionId} final:`, final);
        setInterimTranscript('');
        onResultRef.current(final);
      }
    };

    recognition.onerror = (event) => {
      if (mySessionId !== sessionIdRef.current) return;
      console.error(`❌ [Mobile] Session ${mySessionId} error:`, event.error);
      setListening(false);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        userWantsMicOn.current = false;
        setError('Microphone permission denied. Please allow mic access and try again.');
        return;
      }
      if (event.error === 'aborted' || !userWantsMicOn.current) return;

      // Transient errors (no-speech, network) → retry same session
      console.log(`🔄 [Mobile] Session ${mySessionId} retrying after error in 400ms…`);
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => makeAndStart(mySessionId), 400);
    };

    recognition.onend = () => {
      if (mySessionId !== sessionIdRef.current) return;
      console.log(`📱 [Mobile] Session ${mySessionId} ended`);
      setListening(false);
      setInterimTranscript('');

      if (!userWantsMicOn.current) return;

      // Mobile browser ended the session (silence timeout, OS interruption, etc.)
      // Restart with the SAME session ID — still a valid continuous session
      console.log(`🔄 [Mobile] Session ${mySessionId} restarting in 150ms…`);
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => makeAndStart(mySessionId), 150);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error(`❌ [Mobile] Session ${mySessionId} start() threw:`, err);
      if (userWantsMicOn.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => makeAndStart(mySessionId), 500);
      }
    }
  }, []); // intentionally no deps — everything is accessed via refs

  // ─── start (user action) ─────────────────────────────────────────────────
  const start = useCallback(() => {
    console.log('🎤 [Mobile] >>> START');
    if (userWantsMicOn.current) return; // already running

    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) {
      setError('Speech recognition not supported on this device.');
      return;
    }

    userWantsMicOn.current = true;
    setError(null);
    clearTimeout(retryTimerRef.current);

    // Bump session ID → any pending callbacks from the previous session become no-ops
    sessionIdRef.current += 1;
    makeAndStart(sessionIdRef.current);
  }, [makeAndStart]);

  // ─── stop (user action) ──────────────────────────────────────────────────
  const stop = useCallback(() => {
    console.log('🛑 [Mobile] >>> STOP');
    userWantsMicOn.current = false;
    clearTimeout(retryTimerRef.current);
    // Bump session ID immediately → all pending onend/onerror callbacks become no-ops
    sessionIdRef.current += 1;
    setListening(false);
    setInterimTranscript('');
    setError(null);
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.abort(); } catch { }
      recognitionRef.current = null;
    }
  }, []);

  // ─── toggle ──────────────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    if (userWantsMicOn.current) stop();
    else start();
  }, [start, stop]);

  // ─── cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      userWantsMicOn.current = false;
      clearTimeout(retryTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.onend = null; recognitionRef.current.abort(); } catch { }
        recognitionRef.current = null;
      }
    };
  }, []);

  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return {
    // Keep UI green during the brief 150ms restart gap
    listening: userWantsMicOn.current ? (listening || false) : false,
    toggle,
    stop,
    supported,
    interimTranscript,
    error,
    isStarting: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP: react-speech-recognition (works reliably on desktop browsers)
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
      // Desktop: grab stream so killStream can turn off the browser mic indicator on close
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
// Public hook: routes to the right engine based on platform.
// Both hooks are always called (React rules), isMobile is a module-level constant.
// ─────────────────────────────────────────────────────────────────────────────
export function useSpeech(onResult) {
  const mobile = useMobileSpeech(onResult);
  const desktop = useDesktopSpeech(onResult);
  return isMobile ? mobile : desktop;
}

