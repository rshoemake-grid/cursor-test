import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return getSpeechRecognitionConstructor() !== null;
}

export function isSpeechSynthesisSupported() {
  return typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
}

/**
 * Push-to-talk: hold the control to dictate; transcript updates the input field.
 * @param {object} options
 * @param {() => string} options.getInput
 * @param {(value: string) => void} options.setInput
 * @param {{ debug?: Function, warn?: Function } | undefined} options.logger
 * @param {(finalText: string) => void} [options.onSessionEnd] — called after release when speech was captured (defer to next task so input state can settle).
 */
export function usePushToTalk({ getInput, setInput, logger: log, onSessionEnd }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const prefixRef = useRef("");
  const listeningRef = useRef(false);
  const logRef = useRef(log);
  logRef.current = log;
  const onSessionEndRef = useRef(onSessionEnd);
  onSessionEndRef.current = onSessionEnd;
  const latestTranscriptRef = useRef("");
  const hadResultsRef = useRef(false);

  useEffect(() => {
    const SR = getSpeechRecognitionConstructor();
    if (!SR) return undefined;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let segment = "";
      for (let i = 0; i < event.results.length; i += 1) {
        segment += event.results[i][0].transcript;
      }
      const prefix = prefixRef.current;
      const sep = prefix && segment && !prefix.endsWith(" ") ? " " : "";
      const next = prefix + sep + segment;
      if (segment.trim().length > 0) {
        hadResultsRef.current = true;
      }
      latestTranscriptRef.current = next;
      setInput(next);
    };

    recognition.onerror = (ev) => {
      listeningRef.current = false;
      setIsListening(false);
      logRef.current?.warn?.("Speech recognition error:", ev.error);
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
      const endCb = onSessionEndRef.current;
      if (endCb && hadResultsRef.current) {
        const text = latestTranscriptRef.current;
        window.setTimeout(() => {
          endCb(text);
        }, 0);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [setInput]);

  const onPushStart = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listeningRef.current) return;

    prefixRef.current = getInput();
    hadResultsRef.current = false;
    latestTranscriptRef.current = prefixRef.current;
    try {
      recognition.start();
      listeningRef.current = true;
      setIsListening(true);
    } catch (err) {
      logRef.current?.warn?.("Could not start speech recognition:", err);
      listeningRef.current = false;
      setIsListening(false);
    }
  }, [getInput]);

  const onPushEnd = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !listeningRef.current) return;
    try {
      recognition.stop();
    } catch (err) {
      logRef.current?.warn?.("Could not stop speech recognition:", err);
    }
  }, []);

  return {
    isListening,
    onPushStart,
    onPushEnd,
    supported: isSpeechRecognitionSupported(),
  };
}

/**
 * Read assistant text aloud using the browser Speech Synthesis API (Chrome-compatible).
 */
export function speakChatMessage(text, options = {}) {
  if (!isSpeechSynthesisSupported() || !text || typeof text !== "string") return;

  const trimmed = text.trim();
  if (!trimmed) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = options.lang || "en-US";
  utterance.rate = options.rate ?? 1;
  utterance.pitch = options.pitch ?? 1;
  utterance.volume = options.volume ?? 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
