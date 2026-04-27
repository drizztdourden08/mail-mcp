import type { CheckboxProps } from "./types";
import "./Checkbox.css";

export default function Checkbox({ checked, onChange, label, className }: CheckboxProps) {
  return (
    <label className={`checkbox${className ? ` ${className}` : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label && <span className="checkbox__label">{label}</span>}
    </label>
  );
}
