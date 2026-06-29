import { useState } from "react";

import styles from "./ChatInput.module.css";

type Props = {
  onSend: (
    message: string
  ) => void;
};

const ChatInput = ({
  onSend,
}: Props) => {
  const [message, setMessage] =
    useState("");

  const handleSend = () => {
    if (!message.trim()) {
      return;
    }

    onSend(message);

    setMessage("");
  };

  return (
    <div className={styles.container}>
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