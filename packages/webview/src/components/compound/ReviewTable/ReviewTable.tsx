import { useMemo } from "react";
import Button from "../../primitive/Button/Button";
import TextInput from "../../primitive/TextInput/TextInput";
import Markdown from "../../primitive/Markdown/Markdown";
import ReviewHeaderRow from "./sub/ReviewHeaderRow";
import ReviewRow from "./sub/ReviewRow";
import { useReviewFilter } from "./behavior/useReviewFilter";
import { useReviewSelection } from "./behavior/useReviewSelection";
import type { Review } from "./types";
import "./ReviewTable.css";

interface Props {
  review: Review;
  onApprove?: (selectedIds: string[]) => void;
  onReject?: () => void;
  readOnly?: boolean;
}

export default function ReviewTable({ review, onApprove, onReject, readOnly }: Props) {
  const initialIds = useMemo(
    () => review.items.filter((i) => i.selected).map((i) => i.id),
    [review.id], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const allIds = useMemo(
    () => review.items.map((i) => i.id),
    [review.items],
  );
  const { selected, toggle, selectAll, setSelected } = useReviewSelection(initialIds);
  const { filterText, setFilterText, filtered } = useReviewFilter(review.items);

  return (
    <div className="review-table">
      <Markdown content={review.description} className="review-table__desc" />

      {!readOnly && (
        <div className="review-table__toolbar">
          <TextInput
            placeholder="Filter…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            fullWidth
            className="review-table__filter"
          />
          <Button variant="ghost" onClick={() => selectAll(allIds)}>
            {selected.size === review.items.length ? "Deselect All" : "Select All"}
          </Button>
          <span className="review-table__count">{selected.size}/{review.items.length} selected</span>
        </div>
      )}

      <div className="review-table__list">
        <ReviewHeaderRow columns={review.columns} hasCheckbox={!readOnly} />
        {filtered.map((item) => (
          <ReviewRow
            key={item.id}
            item={item}
            columns={review.columns}
            isSelected={selected.has(item.id)}
            onToggle={toggle}
            readOnly={readOnly}
          />
        ))}
      </div>

      {!readOnly && onApprove && onReject && (
        <div className="review-table__actions">
          <Button variant="primary" onClick={() => onApprove([...selected])}>
            Approve ({selected.size})
          </Button>
          <Button variant="danger" onClick={onReject}>Reject</Button>
        </div>
      )}
    </div>
  );
}
