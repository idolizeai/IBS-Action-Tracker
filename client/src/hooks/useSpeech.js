import { useEffect, useCallback, useState, useRef } from 'react';

/**
 * useSpeech Hook using native Web Speech API
 * @param {Function} onResult - Callback when a final transcript is received
 */
export function useSpeech(onResult) {
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(false);
  
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);
  const onResultRef = useRef(onResult);

  // Keep onResult callback updated without re-triggering effects
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Handle initialization and browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      console.warn('⚠️ Native Speech Recognition is not supported in this browser');
      return;
    }

    setSupported(true);
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('🎤 Native Speech: Listening started');
      setListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        console.log('📝 Native Speech: Final transcript received:', final);
        if (onResultRef.current) {
          onResultRef.current(final.trim());
        }
      }
      
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error('❌ Native Speech Error:', event.error);
      
      // Handle permission errors explicitly
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow mic access in your browser settings.');
        manualStopRef.current = true;
      } else if (event.error === 'no-speech') {
        // Silent error, no need to show to user
      } else if (event.error === 'aborted') {
        // Recognition aborted, usually by manual stop
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      
      setListening(false);
    };

    recognition.onend = () => {
      console.log('🛑 Native Speech: Connection ended');
      
      // Auto-restart logic for mobile browsers (Chrome mobile often stops quickly)
      if (!manualStopRef.current) {
        console.log('🔄 Native Speech: Auto-restarting session...');
        try {
          recognition.start();
        } catch (e) {
          // If it fails to restart, it might be due to "already started" or similar
          console.warn('Native Speech: Auto-restart attempted but session state did not allow it.');
          setListening(false);
        }
      } else {
        setListening(false);
        setInterimTranscript('');
      }
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        manualStopRef.current = true;
        recognitionRef.current.onend = null; // Prevent auto-restart during cleanup
        recognitionRef.current.stop();
      }
    }
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    
    manualStopRef.current = false;
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      // If already started, ignore. Otherwise log.
      if (err.name !== 'InvalidStateError') {
        console.error('❌ Native Speech: Failed to start', err);
        setError('Failed to start microphone');
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    
    manualStopRef.current = true;
    recognitionRef.current.stop();
    setListening(false);
    setInterimTranscript('');
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
    supported,
    interimTranscript,
    error,
    isStarting: false, // Compatibility with previous state
  };
}
