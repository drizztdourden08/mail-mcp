import Checkbox from "../../primitive/Checkbox/Checkbox";
import type { CheckboxListProps } from "./types";
import "./CheckboxList.css";

export default function CheckboxList<T>({
  items,
  selected,
  onToggle,
  renderItem,
  className,
}: CheckboxListProps<T>) {
  return (
    <ul className={`checkbox-list${className ? ` ${className}` : ""}`}>
      {items.map((item) => {
        const isSelected = selected.has(item.id);
        return (
          <li key={item.id} className={`checkbox-list__item${isSelected ? " checkbox-list__item--selected" : ""}`}>
            <label className="checkbox-list__label">
              <Checkbox checked={isSelected} onChange={() => onToggle(item.id)} />
              <div className="checkbox-list__content">{renderItem(item, isSelected)}</div>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
