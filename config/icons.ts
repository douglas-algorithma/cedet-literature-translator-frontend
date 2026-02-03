import type { ComponentType } from "react";
import {
  BookIcon,
  ChevronRightIcon,
  ExportIcon,
  GlossaryIcon,
  HomeIcon,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SparkIcon,
} from "@/components/icons";

export type IconName =
  | "book"
  | "chevron-right"
  | "export"
  | "glossary"
  | "home"
  | "menu"
  | "plus"
  | "search"
  | "settings"
  | "spark";

export const ICONS: Record<IconName, ComponentType<{ className?: string }>> = {
  book: BookIcon,
  "chevron-right": ChevronRightIcon,
  export: ExportIcon,
  glossary: GlossaryIcon,
  home: HomeIcon,
  menu: MenuIcon,
  plus: PlusIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  spark: SparkIcon,
};
