export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  variant?: "building";
}

export interface TabBarProps {
  tabs: TabItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}
