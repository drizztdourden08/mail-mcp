import Badge from "../../primitive/Badge/Badge";
import type { TabBarProps } from "./types";
import "./TabBar.css";

export default function TabBar({ tabs, activeId, onSelect, className }: TabBarProps) {
  return (
    <div className={`tab-bar${className ? ` ${className}` : ""}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-bar__tab${tab.id === activeId ? " tab-bar__tab--active" : ""}${tab.variant === "building" ? " tab-bar__tab--building" : ""}`}
          onClick={() => onSelect(tab.id)}
          title={tab.label}
        >
          {tab.variant === "building" && <span className="tab-bar__building-dot" />}
          {tab.label}
          {tab.badge != null && <Badge count={tab.badge} className="tab-bar__badge" />}
        </button>
      ))}
    </div>
  );
}
