export type TitleLevel = 1 | 2 | 3 | 4;

export interface TitleProps {
  level?: TitleLevel;
  children: React.ReactNode;
  className?: string;
}
