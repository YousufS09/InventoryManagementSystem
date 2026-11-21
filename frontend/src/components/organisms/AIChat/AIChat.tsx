import { useState, useRef, useEffect } from "react";

import styles from "./AIChat.module.css";

import ChatBubble from "../../atoms/ChatBubble/ChatBubble";
import ChatInput from "../../molecules/ChatInput/ChatInput";
import { apiRequest, getErrorMessage } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

type ActionButton = {
  id: string;
  label: string;
};

type Message = {
  sender: "user" | "ai";
  text: string;
  actions?: ActionButton[];
};

type AssistantResponse = {
  reply?: string;
  actions?: ActionButton[];
  audioBase64?: string;
};

// The backend only reads the most recent messages; avoid sending a growing transcript.
const MAX_HISTORY = 12;
// Messages kept in the browser so the conversation survives a page refresh.
const MAX_STORED_MESSAGES = 50;

const WELCOME_MESSAGE: Message = {
  sender: "ai",
  text: "Hello! I am your Inventory Management Assistant. How can I help you today?",
};

// Stored per user, so a different account on the same browser never sees it.
const historyKey = (userId: number | undefined) => `aiChatHistory:${userId ?? "anonymous"}`;

function loadHistory(userId: number | undefined): Message[] {
  try {
    const raw = localStorage.getItem(historyKey(userId));
    const parsed = raw ? (JSON.parse(raw) as Message[]) : null;
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Confirm/cancel buttons belong to a server-side step that may have expired; don't restore them.
      return parsed.map((message) => ({ sender: message.sender, text: message.text }));
    }
  } catch {
    // Corrupt or blocked storage: start a fresh conversation.
  }
  return [WELCOME_MESSAGE];
}

const getSessionId = () => {
  try {
    let sessionId = localStorage.getItem("aiSessionId");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("aiSessionId", sessionId);
    }
    return sessionId;
  } catch {
    // Storage can be blocked (private mode); a per-page id still works.
    return crypto.randomUUID();
  }
};

const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => loadHistory(user?.id));

  useEffect(() => {
    try {
      localStorage.setItem(
        historyKey(user?.id),
        JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
      );
    } catch {
      // Storage full or blocked; the chat still works for this page view.
    }
  }, [messages, user?.id]);

  const clearHistory = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(getSessionId());

  const speakReply = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const speech = window.speechSynthesis;
    speech.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    speech.speak(utterance);
  };

  const playAssistantAudio = (audioBase64: string, fallbackText: string) => {
    try {
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      void audio.play().catch(() => speakReply(fallbackText));
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sends messages to the assistant and appends its reply (or an error) to the chat.
  const sendToAssistant = async (payload: { role: "user" | "assistant"; content: string }[]) => {
    setLoading(true);

    try {
      const data = await apiRequest<AssistantResponse>("/api/assistant/chat", {
        method: "POST",
        body: {
          sessionId: sessionIdRef.current,
          voiceOutput: voiceEnabled,
          messages: payload.slice(-MAX_HISTORY),
        },
      });

      const replyText = data.reply || "No response received.";

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: replyText, actions: data.actions || [] },
      ]);

      if (!(data.audioBase64 && playAssistantAudio(data.audioBase64, replyText))) {
        speakReply(replyText);
      }
    } catch (error) {
      const errorText = getErrorMessage(
        error,
        "Sorry, something went wrong while contacting the assistant. You can continue typing below."
      );

      setMessages((prev) => [...prev, { sender: "ai", text: errorText }]);
      speakReply(errorText);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (message: string) => {
    if (!message.trim() || loading) {
      return;
    }

    const updatedMessages: Message[] = [...messages, { sender: "user", text: message }];
    setMessages(updatedMessages);

    await sendToAssistant(
      updatedMessages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }))
    );
  };

  const handleActionClick = async (actionId: string) => {
    if (loading) {
      return;
    }

    // Buttons only work once; hide them so a second click cannot repeat the action.
    setMessages((prev) => prev.map((msg) => (msg.actions?.length ? { ...msg, actions: [] } : msg)));

    await sendToAssistant([{ role: "user", content: `__ACTION__:${actionId}` }]);
  };

  return (
    <div className={styles.chatContainer}>
      {messages.length > 1 && (
        <div className={styles.chatHeader}>
          <button type="button" className={styles.clearButton} onClick={clearHistory} disabled={loading}>
            Clear conversation
          </button>
        </div>
      )}

      <div className={styles.messagesArea}>
        {messages.map((message, index) => (
          <ChatBubble
            key={index}
            sender={message.sender}
            text={message.text}
            actions={message.actions}
            onActionClick={handleActionClick}
          />
        ))}

        {loading && <ChatBubble sender="ai" text="Thinking..." />}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => {
          setVoiceEnabled((current) => !current);

          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
        }}
        onTranscript={handleSend}
      />
    </div>
  );
};

export default AIChat;
