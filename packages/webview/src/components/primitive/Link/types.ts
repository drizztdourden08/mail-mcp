export interface LinkProps {
  href: string;
  onNavigate?: (url: string) => void;
  children: React.ReactNode;
  className?: string;
}
