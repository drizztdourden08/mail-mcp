export interface CodeDisplayProps {
  code: string;
  onCopy?: () => void;
  copied?: boolean;
  className?: string;
}
