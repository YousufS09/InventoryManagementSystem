import React from "react";
import styles from "./Input.module.css";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  ref?: React.Ref<HTMLInputElement>;
};

const Input: React.FC<InputProps> = (props) => {
  return <input {...props} className={styles.input} />;
};

export default Input;
