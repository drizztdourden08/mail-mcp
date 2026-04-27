import type { LinkProps } from "./types";
import "./Link.css";

export default function Link({ href, onNavigate, children, className }: LinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate?.(href);
  };

  return (
    <a href={href} className={`link${className ? ` ${className}` : ""}`} onClick={handleClick}>
      {children}
    </a>
  );
}
