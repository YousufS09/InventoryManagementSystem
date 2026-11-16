import React from "react";
import Input from "../../atoms/Input/Input";
import Label from "../../atoms/Label/Label";
import styles from "./InputField.module.css";

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  error?: string;
  // React 19 passes `ref` as a regular prop, so react-hook-form's register() works directly.
  ref?: React.Ref<HTMLInputElement>;
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  error,
  type = "text",
  ...inputProps
}) => {
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <Label text={label} htmlFor={id} />
      <Input
        id={id}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;
