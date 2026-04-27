export type ReviewStatus = "building" | "pending" | "approved" | "rejected" | "closed";

export interface ReviewColumn {
  key: string;
  label: string;
  width?: string;
}

export interface ReviewItem {
  id: string;
  selected: boolean;
  fields: Record<string, string>;
}

export interface Review {
  id: string;
  name: string;
  description: string;
  columns: ReviewColumn[];
  items: ReviewItem[];
  status: ReviewStatus;
  selectedIds: string[];
  createdAt: number;
}

export interface ApprovalResult {
  approved: boolean;
  selectedIds: string[];
}
