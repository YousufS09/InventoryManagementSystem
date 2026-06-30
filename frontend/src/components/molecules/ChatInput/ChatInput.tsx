import { useState } from "react";
import { FiMic, FiMicOff, FiRefreshCw } from "react-icons/fi";

import styles from "./ChatInput.module.css";
import useSpeechRecognition from "../../../hooks/useSpeechRecognition";

type Props = {
  onSend: (
    message: string
  ) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onTranscript: (transcript: string) => void;
};

const ChatInput = ({
  onSend,
  voiceEnabled,
  onToggleVoice,
  onTranscript,
}: Props) => {
  const [message, setMessage] =
    useState("");

  const {
    error,
    isListening,
    isSupported,
    resetTranscript,
    startListening,
    stopListening,
    transcript,
  } = useSpeechRecognition({
    onTranscript,
  });

  const handleSend = () => {
    if (!message.trim()) {
      return;
    }

    onSend(message);

    setMessage("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        <textarea
          value={message}
          onChange={(e) =>
            setMessage(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey
            ) {
              e.preventDefault();

              handleSend();
            }
          }}
          placeholder="Ask AI Assistant..."
          className={styles.input}
        />

        {(transcript || error) && (
          <div className={styles.hintRow}>
            {transcript && (
              <div className={styles.transcript}>
                <span className={styles.transcriptLabel}>
                  Heard:
                </span>
                <span className={styles.transcriptText}>
                  {transcript}
                </span>
              </div>
            )}

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}
          </div>
        )}

        <div className={styles.voiceRow}>
          <button
            type="button"
            className={`${styles.voiceToggle} ${
              voiceEnabled
                ? styles.voiceToggleOn
                : ""
            }`}
            onClick={onToggleVoice}
          >
            {voiceEnabled
              ? "Voice On"
              : "Voice Off"}
          </button>

          {!isSupported ? (
            <div className={styles.warning}>
              Speech recognition is not supported in this browser.
            </div>
          ) : (
            <>
              <button
                type="button"
                className={`${styles.micButton} ${
                  isListening
                    ? styles.micButtonActive
                    : ""
                }`}
                onClick={
                  isListening
                    ? stopListening
                    : startListening
                }
                disabled={!voiceEnabled}
              >
                {isListening ? (
                  <FiMicOff />
                ) : (
                  <FiMic />
                )}
                {isListening
                  ? "Stop"
                  : "Speak"}
              </button>

              <button
                type="button"
                className={styles.resetButton}
                onClick={resetTranscript}
                disabled={!transcript && !error}
              >
                <FiRefreshCw />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      <button
        onClick={handleSend}
        className={styles.sendBtn}
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
