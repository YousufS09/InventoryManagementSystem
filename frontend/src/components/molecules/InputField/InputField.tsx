import React from "react";
import Input from "../../atoms/Input/Input";
import Label from "../../atoms/Label/Label";
import styles from "./InputField.module.css";

type InputFieldProps = {
  label: string;
  id: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  type = "text",
  value,
  onChange,   
}) => {
  return (
    <div className={styles.field}>
      <Label text={label} htmlFor={id} />
      <Input id={id} type={type} value={value} onChange={onChange} />
    </div>
  );
};

export default InputField;