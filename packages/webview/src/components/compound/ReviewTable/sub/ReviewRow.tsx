import Checkbox from "../../../primitive/Checkbox/Checkbox";
import type { ReviewColumn, ReviewItem } from "../types";

interface Props {
  item: ReviewItem;
  columns: ReviewColumn[];
  isSelected: boolean;
  onToggle: (id: string) => void;
  readOnly?: boolean;
}

export default function ReviewRow({ item, columns, isSelected, onToggle, readOnly }: Props) {
  return (
    <label className={`review-table__row${isSelected ? " review-table__row--selected" : ""}`}>
      {!readOnly && (
        <div className="review-table__cell review-table__check-col">
          <Checkbox checked={isSelected} onChange={() => onToggle(item.id)} />
        </div>
      )}
      {columns.map((col) => (
        <div
          key={col.key}
          className="review-table__cell"
          style={col.width ? { width: col.width, flex: "none" } : {}}
        >
          {item.fields[col.key] ?? ""}
        </div>
      ))}
    </label>
  );
}
