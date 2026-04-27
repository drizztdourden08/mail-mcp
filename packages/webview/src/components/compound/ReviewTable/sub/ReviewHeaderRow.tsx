import type { ReviewColumn } from "../types";

interface Props {
  columns: ReviewColumn[];
  hasCheckbox?: boolean;
}

export default function ReviewHeaderRow({ columns, hasCheckbox = true }: Props) {
  return (
    <div className="review-table__header-row">
      {hasCheckbox && <div className="review-table__cell review-table__check-col" />}
      {columns.map((col) => (
        <div
          key={col.key}
          className="review-table__cell"
          style={col.width ? { width: col.width, flex: "none" } : {}}
        >
          {col.label}
        </div>
      ))}
    </div>
  );
}
