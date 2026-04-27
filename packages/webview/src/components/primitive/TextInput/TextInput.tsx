import type { TextInputProps } from "./types";
import "./TextInput.css";

export default function TextInput({ fullWidth, className, ...rest }: TextInputProps) {
  return (
    <input
      className={`text-input${fullWidth ? " text-input--full" : ""}${className ? ` ${className}` : ""}`}
      {...rest}
    />
  );
}
