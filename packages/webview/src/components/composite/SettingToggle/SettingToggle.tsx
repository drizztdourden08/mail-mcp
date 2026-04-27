import Checkbox from "../../primitive/Checkbox/Checkbox";
import Text from "../../primitive/Text/Text";
import type { SettingToggleProps } from "./types";
import "./SettingToggle.css";

export default function SettingToggle({ checked, onChange, label, description, className }: SettingToggleProps) {
  return (
    <div className={`setting-toggle${className ? ` ${className}` : ""}`}>
      <Checkbox
        checked={checked}
        onChange={onChange}
        label={
          <span>
            <strong>{label}</strong>
            {description && <Text variant="hint" className="setting-toggle__desc">{description}</Text>}
          </span>
        }
      />
    </div>
  );
}
