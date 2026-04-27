import type { NavBarProps } from "./types";
import "./NavBar.css";

export default function NavBar({ items, activeId, onSelect, trailing, className }: NavBarProps) {
  const left = items.filter((i) => i.align !== "right");
  const right = items.filter((i) => i.align === "right");

  return (
    <nav className={`nav-bar${className ? ` ${className}` : ""}`}>
      {left.map((item) => (
        <button
          key={item.id}
          className={`nav-bar__item${item.id === activeId ? " nav-bar__item--active" : ""}`}
          onClick={() => onSelect(item.id)}
        >
          {item.icon && <span className="nav-bar__icon" dangerouslySetInnerHTML={{ __html: item.icon }} />}
          {item.label}
        </button>
      ))}
      <span className="nav-bar__spacer" />
      {right.map((item) => (
        <button
          key={item.id}
          className={`nav-bar__item${item.id === activeId ? " nav-bar__item--active" : ""}`}
          onClick={() => onSelect(item.id)}
        >
          {item.icon && <span className="nav-bar__icon" dangerouslySetInnerHTML={{ __html: item.icon }} />}
          {item.label}
        </button>
      ))}
      {trailing && <div className="nav-bar__trailing">{trailing}</div>}
    </nav>
  );
}
