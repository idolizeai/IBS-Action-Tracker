import { useEffect, useCallback, useState, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
);

export function useSpeech(onResult) {
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // The single source of truth: does the USER want the mic on?
  const userWantsMicOn = useRef(false);
  // Guard against overlapping restartAttempts (separate from isStarting)
  const isRestartingRef = useRef(false);
  const restartTimerRef = useRef(null);
  const streamRef = useRef(null);

  const {
    interimTranscript,
    finalTranscript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  // Pass final transcript up to the parent
  useEffect(() => {
    if (!finalTranscript) return;
    console.log('📝 Final transcript:', finalTranscript);
    onResult(finalTranscript);
    resetTranscript();
  }, [finalTranscript, onResult, resetTranscript]);

  // ─── killStream ────────────────────────────────────────────────────────────
  // Desktop only: turns off the red browser mic indicator after stopping
  const killStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ─── Raw restart (no guards — intentionally aggressive) ───────────────────
  // Mobile Chrome will kill SpeechRecognition after every sentence/pause.
  // The ONLY fix is to immediately restart. We use a ref-based lock to prevent
  // double-calls, but we do NOT check isStarting (that's only for the user button).
  const scheduleRestart = useCallback(() => {
    if (!userWantsMicOn.current) return;
    if (isRestartingRef.current) return;

    clearTimeout(restartTimerRef.current);
    isRestartingRef.current = true;

    // On mobile, use a tiny delay (100ms) to let the hardware reset cleanly.
    // On desktop this path rarely executes, but keep it safe.
    restartTimerRef.current = setTimeout(async () => {
      if (!userWantsMicOn.current) {
        isRestartingRef.current = false;
        return;
      }
      console.log('🔄 Auto-restarting (mobile browser stopped SpeechRecognition)…');
      try {
        await SpeechRecognition.startListening({
          continuous: true,
          language: 'en-US',
          interimResults: true,
        });
        console.log('✅ Auto-restart successful');
      } catch (err) {
        console.warn('⚠️ Auto-restart failed, retrying in 500ms:', err);
        // If the restart itself fails, try again shortly
        restartTimerRef.current = setTimeout(() => {
          isRestartingRef.current = false;
          scheduleRestart();
        }, 500);
        return;
      }
      isRestartingRef.current = false;
    }, isMobile ? 100 : 200);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Watch `listening` — if the browser killed it while user wants it ON, restart ──
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;
    if (!userWantsMicOn.current) return;   // User pressed stop — don't restart
    if (listening) {
      // Currently running fine — clear restart state
      isRestartingRef.current = false;
      clearTimeout(restartTimerRef.current);
      return;
    }
    // listening just went false while user still wants it → trigger restart
    scheduleRestart();
  }, [listening, browserSupportsSpeechRecognition, scheduleRestart]);

  // ─── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(restartTimerRef.current);
      SpeechRecognition.stopListening().catch(() => { });
      killStream();
    };
  }, [killStream]);

  // ─── start ────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    console.log('🎤 >>> START');
    if (!browserSupportsSpeechRecognition) {
      setError('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }
    if (isStarting) return;

    setIsStarting(true);
    setError(null);
    resetTranscript();
    userWantsMicOn.current = true;
    isRestartingRef.current = false;
    clearTimeout(restartTimerRef.current);

    try {
      // Desktop: grab stream so killStream can turn off the browser mic indicator
      if (!isMobile) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          console.log('✅ Desktop stream acquired');
        } catch (e) {
          console.warn('⚠️ getUserMedia failed:', e);
        }
      }
      // Mobile: skip getUserMedia entirely (hardware lock breaks SpeechRecognition)

      await SpeechRecognition.startListening({
        continuous: true,
        language: 'en-US',
        interimResults: true,
      });
      console.log('✅ Listening started');
    } catch (err) {
      console.error('❌ start() failed:', err);
      setError(err.message || 'Failed to start microphone');
      userWantsMicOn.current = false;
    } finally {
      setIsStarting(false);
    }
  }, [browserSupportsSpeechRecognition, isStarting, resetTranscript]);

  // ─── stop ─────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    console.log('🛑 >>> STOP');
    userWantsMicOn.current = false;  // Disables auto-restart
    isRestartingRef.current = false;
    clearTimeout(restartTimerRef.current);
    SpeechRecognition.stopListening();
    resetTranscript();
    setIsStarting(false);
    setError(null);
    killStream();
  }, [resetTranscript, killStream]);

  // ─── toggle ───────────────────────────────────────────────────────────────
  // Toggle uses userWantsMicOn (user intent) NOT `listening` (hardware state).
  // On mobile these frequently differ because the browser kills the API silently.
  const toggle = useCallback(async () => {
    if (userWantsMicOn.current) {
      stop();
    } else {
      await start();
    }
  }, [start, stop]);

  // The UI should show "active" whenever the user wants the mic on,
  // even during the brief restart gap when listening is momentarily false.
  const uiListening = userWantsMicOn.current ? (listening || isStarting || isRestartingRef.current) : false;

  return {
    listening: uiListening,
    toggle,
    stop,
    supported: browserSupportsSpeechRecognition,
    interimTranscript,
    error,
    isStarting,
  };
}
