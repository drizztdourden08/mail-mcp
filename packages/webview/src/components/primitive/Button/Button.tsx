import type { ButtonProps } from "./types";
import "./Button.css";

export default function Button({ variant = "default", className, ...rest }: ButtonProps) {
  return <button className={`btn btn--${variant}${className ? ` ${className}` : ""}`} {...rest} />;
}
