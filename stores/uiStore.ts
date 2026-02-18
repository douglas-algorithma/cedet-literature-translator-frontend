import { create } from "zustand";

import type { UiState } from "@/types/ui";

type UiStore = UiState & {
  toggleHitlPanel: () => void;
  toggleSyncScroll: () => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setActiveTab: (tab?: string) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  hitlPanelOpen: false,
  syncScrollEnabled: true,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeTab: undefined,
  toggleHitlPanel: () => set((state) => ({ hitlPanelOpen: !state.hitlPanelOpen })),
  toggleSyncScroll: () => set((state) => ({ syncScrollEnabled: !state.syncScrollEnabled })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
