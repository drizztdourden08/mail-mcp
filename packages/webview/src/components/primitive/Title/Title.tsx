import type { TitleProps } from "./types";
import "./Title.css";

export default function Title({ level = 2, children, className }: TitleProps) {
  const Tag = `h${level}` as const;
  return <Tag className={`title title--h${level}${className ? ` ${className}` : ""}`}>{children}</Tag>;
}
