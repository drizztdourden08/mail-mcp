export type StatusColor = "green" | "yellow" | "red" | "gray";

export const STATUS_CSS_COLORS: Record<StatusColor, string> = {
  green: "var(--vscode-charts-green, #4caf50)",
  yellow: "var(--vscode-charts-yellow, #ffb300)",
  red: "var(--vscode-errorForeground, #d32f2f)",
  gray: "var(--vscode-descriptionForeground, #888)",
};

export interface StatusLightProps {
  color: StatusColor;
  glow?: boolean;
  className?: string;
}
