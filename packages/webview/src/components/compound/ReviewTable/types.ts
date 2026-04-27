export interface ReviewColumn {
  key: string;
  label: string;
  width?: string;
}

export interface ReviewItem {
  id: string;
  fields: Record<string, string>;
}

export interface Review {
  id: string;
  name: string;
  description: string;
  columns: ReviewColumn[];
  items: ReviewItem[];
  status: string;
  selectedIds: string[];
  createdAt: number;
}
