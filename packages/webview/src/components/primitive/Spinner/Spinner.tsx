import type { SpinnerProps } from "./types";
import "./Spinner.css";

export default function Spinner({ size = "md", className }: SpinnerProps) {
  return <span className={`spinner spinner--${size}${className ? ` ${className}` : ""}`} />;
}
