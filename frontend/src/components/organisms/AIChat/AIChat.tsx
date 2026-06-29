import {
  useState,
  useRef,
  useEffect,
} from "react";

import styles from "./AIChat.module.css";

import ChatBubble from "../../atoms/ChatBubble/ChatBubble";

import ChatInput from "../../molecules/ChatInput/ChatInput";
import VoiceCommandBar from "../../molecules/VoiceCommandBar/VoiceCommandBar";
import { apiFetch } from "../../../services/api";

type ActionButton = {
  id: string;
  label: string;
};

type Message = {
  sender: "user" | "ai";
  text: string;

  actions?: ActionButton[];
};

const AIChat = () => {
  const [messages, setMessages] =
    useState<Message[]>([
      {
        sender: "ai",
        text:
          "Hello! I am your Inventory Management Assistant. How can I help you today?",
      },
    ]);

  const [loading, setLoading] =
    useState(false);

  const [voiceEnabled, setVoiceEnabled] =
    useState(true);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const getSessionId = () => {
    let sessionId =
      localStorage.getItem(
        "aiSessionId"
      );

    if (!sessionId) {
      sessionId =
        crypto.randomUUID();

      localStorage.setItem(
        "aiSessionId",
        sessionId
      );
    }

    return sessionId;
  };

  const speakReply = (text: string) => {
    if (
      !voiceEnabled ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    const speech =
      window.speechSynthesis;

    speech.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    speech.speak(utterance);
  };

  const playAssistantAudio = (
    audioBase64: string,
    fallbackText: string
  ) => {
    if (!audioBase64) {
      return false;
    }

    try {
      const audio =
        new Audio(
          `data:audio/wav;base64,${audioBase64}`
        );

      void audio.play().catch(
        () => {
          speakReply(
            fallbackText
          );
        }
      );

      return true;
    } catch (error) {
      console.error(error);

      return false;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  const handleSend = async (
    message: string
  ) => {
    if (!message.trim()) {
      return;
    }

    const updatedMessages = [
      ...messages,
      {
        sender: "user" as const,
        text: message,
      },
    ];

    setMessages(updatedMessages);

    setLoading(true);

    try {
      const response =
        await apiFetch(
          "/api/assistant/chat",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

              body: JSON.stringify({
                message,

                sessionId:
                  getSessionId(),

                voiceOutput:
                  voiceEnabled,

                messages:
                  updatedMessages.map(
                  (
                    msg
                  ) => ({
                    role:
                      msg.sender ===
                      "user"
                        ? "user"
                        : "assistant",

                    content:
                      msg.text,
                  })
                ),
            }),
          }
        );

      const data =
        await response.json();

      const replyText =
        data.reply ||
        "No response received.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",

          text: replyText,

          actions:
            data.actions || [],
        },
      ]);

      if (
        data.audioBase64 &&
        playAssistantAudio(
          data.audioBase64,
          replyText
        )
      ) {
        return;
      }

      speakReply(replyText);
    } catch (error) {
      console.error(error);

      const fallbackText =
        "Sorry, something went wrong while contacting the assistant. You can continue typing below.";

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",

          text: fallbackText,
        },
      ]);

      speakReply(fallbackText);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = async (
  actionId: string
) => {
  setLoading(true);

  try {
    const response =
      await apiFetch(
        "/api/assistant/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            sessionId:
              getSessionId(),

            voiceOutput:
              voiceEnabled,

            messages: [
              {
                role: "user",
                content:
                  `__ACTION__:${actionId}`,
              },
            ],
          }),
        }
      );

    const data =
      await response.json();

    const replyText =
      data.reply ||
      "No response received.";

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: replyText,
        actions:
          data.actions || [],
      },
    ]);

    if (
      data.audioBase64 &&
      playAssistantAudio(
        data.audioBase64,
        replyText
      )
    ) {
      return;
    }

    speakReply(replyText);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div
      className={
        styles.chatContainer
      }
    >
      <VoiceCommandBar
        voiceEnabled={
          voiceEnabled
        }

        onToggleVoice={() => {
          setVoiceEnabled(
            (current) => !current
          );

          if (
            typeof window !== "undefined" &&
            "speechSynthesis" in window
          ) {
            window.speechSynthesis.cancel();
          }
        }}

        onTranscript={
          handleSend
        }
      />

      <div
        className={
          styles.messagesArea
        }
      >
        {messages.map(
          (
            message,
            index
          ) => (
            <ChatBubble
              key={index}
              sender={
                message.sender
              }
              text={message.text}
              actions={
                message.actions
              }
              onActionClick={
                handleActionClick
              }
            />
          )
        )}

        {loading && (
          <ChatBubble
            sender="ai"
            text="Thinking..."
          />
        )}

        <div
          ref={messagesEndRef}
        />
      </div>

      <ChatInput
        onSend={handleSend}
      />
    </div>
  );
};

export default AIChat;
