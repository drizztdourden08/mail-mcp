import type { TextProps } from "./types";
import "./Text.css";

export default function Text({ variant = "body", children, className, style }: TextProps) {
  return (
    <p className={`text text--${variant}${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </p>
  );
}
