export interface CheckboxListItem<T = unknown> {
  id: string;
  data: T;
}

export interface CheckboxListProps<T = unknown> {
  items: CheckboxListItem<T>[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  renderItem: (item: CheckboxListItem<T>, isSelected: boolean) => React.ReactNode;
  className?: string;
}
