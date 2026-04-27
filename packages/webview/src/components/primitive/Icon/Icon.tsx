import type { IconProps } from "./types";
import "./Icon.css";

export default function Icon({ svg, children, size = 16, className, title }: IconProps) {
  if (svg) {
    return (
      <span
        className={`icon${className ? ` ${className}` : ""}`}
        style={{ width: size, height: size }}
        title={title}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  return (
    <span
      className={`icon${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size, fontSize: size }}
      title={title}
    >
      {children}
    </span>
  );
}
