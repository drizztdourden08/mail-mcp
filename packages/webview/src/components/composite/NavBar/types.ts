export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  align?: "left" | "right";
}

export interface NavBarProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  trailing?: React.ReactNode;
  className?: string;
}
