import styles from "./ChatBubble.module.css";

type ActionButton = {
  id: string;
  label: string;
};

type Props = {
  sender: "user" | "ai";

  text: string;

  actions?: ActionButton[];

  onActionClick?: (
    actionId: string
  ) => void;
};

const ChatBubble = ({
  sender,
  text,
  actions = [],
  onActionClick,
}: Props) => {
  return (
    <div
      className={`${styles.messageRow} ${
        sender === "user"
          ? styles.userRow
          : styles.aiRow
      }`}
    >
      <div>
        <div
          className={`${styles.messageBubble} ${
            sender === "user"
              ? styles.userBubble
              : styles.aiBubble
          }`}
        >
          {text}
        </div>

        {sender === "ai" &&
          actions.length > 0 && (
            <div
              className={
                styles.actionContainer
              }
            >
              {actions.map(
                (action) => (
                  <button
                    key={
                      action.id
                    }
                    className={
                      styles.actionButton
                    }
                    onClick={() =>
                      onActionClick?.(
                        action.id
                      )
                    }
                  >
                    {
                      action.label
                    }
                  </button>
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default ChatBubble;