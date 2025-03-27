import { UserPreferences, PanelPosition } from "../types";

const DEFAULT_PREFERENCES: UserPreferences = {
  panelPosition: "bottom-right",
  darkMode: false,
  contestSafeMode: true,
  neverUploadToRemote: true,
  panelVisible: false,
};

export async function getPreferences(): Promise<UserPreferences> {
  const result = await chrome.storage.sync.get("preferences");
  const userPreferences = { ...DEFAULT_PREFERENCES, ...result.preferences };

  return {
    ...userPreferences,
    contestSafeMode: true,
    neverUploadToRemote: true,
  };
}

export async function savePreferences(
  preferences: Partial<UserPreferences>
): Promise<void> {
  const current = await getPreferences();
  const updated = { ...current, ...preferences };

  updated.contestSafeMode = true;
  updated.neverUploadToRemote = true;

  await chrome.storage.sync.set({ preferences: updated });
}

export async function getPanelPosition(): Promise<PanelPosition> {
  const result = await chrome.storage.sync.get("panelPosition");
  return result.panelPosition || { x: 0, y: 0, width: 400, height: 500 };
}

export async function savePanelPosition(
  position: PanelPosition
): Promise<void> {
  await chrome.storage.sync.set({ panelPosition: position });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function safeGetElement(selector: string): HTMLElement | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

export function sanitizeText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^\w\s\-.,!?;:()[\]{}]/g, "");
}

export function isContestPage(): boolean {
  return window.location.href.includes("/contest/");
}

export function isProblemPage(): boolean {
  return window.location.href.includes("/problems/") && !isContestPage();
}
