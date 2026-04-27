export type ButtonVariant = "default" | "primary" | "danger" | "icon" | "ghost";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}
