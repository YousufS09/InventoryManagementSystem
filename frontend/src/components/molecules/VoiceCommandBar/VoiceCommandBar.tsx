import { FiMic, FiMicOff, FiRefreshCw } from "react-icons/fi";

import styles from "./VoiceCommandBar.module.css";
import useSpeechRecognition from "../../../hooks/useSpeechRecognition";

type Props = {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onTranscript: (transcript: string) => void;
};

const VoiceCommandBar = ({
  voiceEnabled,
  onToggleVoice,
  onTranscript,
}: Props) => {
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

  return (
    <section className={styles.voiceCard}>
      <div className={styles.copy}>
        <div className={styles.kicker}>Voice Control</div>
        <h2 className={styles.title}>
          {voiceEnabled
            ? "Voice mode is on"
            : "Voice mode is off"}
        </h2>
        <p className={styles.description}>
          Say things like "Create customer Raj", "Update product Laptop price to 60000", or
          "Delete customer Raj". The assistant will speak its replies when voice mode is on.
        </p>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.voiceToggle} ${
            voiceEnabled ? styles.voiceToggleOn : ""
          }`}
          onClick={onToggleVoice}
        >
          {voiceEnabled ? "Disable Voice Mode" : "Enable Voice Mode"}
        </button>

        {!isSupported ? (
          <div className={styles.warning}>
            Speech recognition is not supported in this browser. Try Chrome or Edge, and use the
            text box below if you want to continue typing.
          </div>
        ) : (
          <>
            <button
              type="button"
              className={`${styles.micButton} ${
                isListening ? styles.micButtonActive : ""
              }`}
              onClick={isListening ? stopListening : startListening}
              disabled={!voiceEnabled}
            >
              {isListening ? <FiMicOff /> : <FiMic />}
              {voiceEnabled
                ? isListening
                  ? "Stop Listening"
                  : "Start Voice Command"
                : "Enable Voice Mode first"}
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

      <div className={styles.statusRow}>
        <span className={`${styles.statusDot} ${isListening ? styles.statusDotActive : ""}`} />
        <span className={styles.statusText}>
          {!voiceEnabled
            ? "Voice mode is off. You can still type below."
            : isListening
            ? "Listening..."
            : transcript
            ? "Ready to send transcript"
            : "Use your voice to control inventory actions"}
        </span>
      </div>

      {transcript && (
        <div className={styles.transcriptBox}>
          <div className={styles.transcriptLabel}>Heard</div>
          <div className={styles.transcriptText}>{transcript}</div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.helperText}>
        Text input stays available below at all times. If voice recognition errors out, keep typing and
        continue normally.
      </div>
    </section>
  );
};

export default VoiceCommandBar;
