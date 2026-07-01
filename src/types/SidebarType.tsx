import * as Lucide from "lucide-react";
import * as ReactIcons from "react-icons";

export const SidebarStatus = {
  NONE: 0,
  DEV: 1,
  NEW: 2,
  BETA: 3,
} as const;

export type SidebarStatus = (typeof SidebarStatus)[keyof typeof SidebarStatus];

export type SidebarChildren = {
  name: string;
  uri: string;
  icon: Lucide.LucideIcon;
  status: SidebarStatus;
};

export type SidebarItemObject = {
  name: string;
  icon: Lucide.LucideIcon;
  children: SidebarChildren[];
};

export type SidebarLinkObject = {
  name: string;
  icon: ReactIcons.IconType;
  url: string;
  special: boolean | null;
};

export type SidebarBadgeObject = {
  name: string;
  internal_id: SidebarStatus;
  class: string;
};