import React from "react";
import styles from "./Button.module.css";

type ButtonProps = {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  disabled = false,
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${disabled ? styles.disabled : ""}`}
    >
      {text}
    </button>
  );
};

export default Button;