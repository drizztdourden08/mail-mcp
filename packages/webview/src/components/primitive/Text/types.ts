export type TextVariant = "body" | "hint" | "error" | "description" | "waiting";

export interface TextProps {
  variant?: TextVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
