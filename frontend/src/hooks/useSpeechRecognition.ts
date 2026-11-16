import { useEffect, useRef, useState } from "react";

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
    length: number;
  }>;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type UseSpeechRecognitionArgs = {
  onTranscript: (transcript: string) => void;
};

const useSpeechRecognition = ({
  onTranscript,
}: UseSpeechRecognitionArgs) => {
  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(
      null
    );

  const onTranscriptRef =
    useRef(onTranscript);

  const latestTranscriptRef =
    useRef("");

  const [isListening, setIsListening] =
    useState(false);

  // Checked once on first render instead of inside the effect.
  const [isSupported] = useState(() => {
    const win =
      window as WindowWithSpeechRecognition;
    return Boolean(
      win.SpeechRecognition ||
        win.webkitSpeechRecognition
    );
  });

  const [transcript, setTranscript] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    onTranscriptRef.current =
      onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const win =
      window as WindowWithSpeechRecognition;

    const SpeechRecognitionCtor =
      win.SpeechRecognition ||
      win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition =
      new SpeechRecognitionCtor();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      latestTranscriptRef.current = "";
      setTranscript("");
      setError(null);
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let nextTranscript = "";

      for (
        let index =
          event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        nextTranscript +=
          event.results[index][0]
            .transcript;
      }

      latestTranscriptRef.current =
        nextTranscript;

      setTranscript(nextTranscript);
    };

    recognition.onerror = (event) => {
      setError(
        event.error ||
          "Speech recognition failed."
      );
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);

      const finalTranscript =
        latestTranscriptRef.current.trim();

      if (finalTranscript) {
        onTranscriptRef.current(
          finalTranscript
        );
      }

      latestTranscriptRef.current = "";
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      setError(
        "Speech recognition is not supported in this browser."
      );
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Unable to start microphone."
      );
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const resetTranscript = () => {
    latestTranscriptRef.current = "";
    setTranscript("");
    setError(null);
  };

  return {
    error,
    isListening,
    isSupported,
    resetTranscript,
    startListening,
    stopListening,
    transcript,
  };
};

export default useSpeechRecognition;
