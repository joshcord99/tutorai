import { getPreferences, savePreferences } from "../tools/utils";
import { UserPreferences } from "../types";

class OptionsManager {
  private formElements: {
    [key: string]: HTMLInputElement | HTMLSelectElement;
  } = {};

  constructor() {
    this.initializeFormElements();
    this.loadSettings();
    this.setupEventListeners();
  }

  private initializeFormElements(): void {
    const elements = [
      "openaiApiKey",
      "anthropicApiKey",
      "geminiApiKey",
      "claudeApiKey",
      "panelPosition",
      "darkMode",
      "fontSize",
    ];

    elements.forEach((id) => {
      const element = document.getElementById(id) as
        | HTMLInputElement
        | HTMLSelectElement;
      if (element) {
        this.formElements[id] = element;
      }
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const preferences = await getPreferences();

      Object.entries(preferences).forEach(([key, value]) => {
        const element = this.formElements[key];
        if (element) {
          if (
            element instanceof HTMLInputElement &&
            element.type === "checkbox"
          ) {
            element.checked = value as boolean;
          } else {
            element.value = value as string;
          }
        }
      });

      const darkModeToggle = document.getElementById(
        "darkMode"
      ) as HTMLInputElement;
      if (darkModeToggle) {
        this.toggleDarkMode(darkModeToggle.checked);
      }
    } catch (error) {
      this.showStatus("Failed to load settings", "error");
    }
  }

  private setupEventListeners(): void {
    Object.entries(this.formElements).forEach(([key, element]) => {
      element.addEventListener("change", () => this.trackChange(key, element));
    });

    const darkModeToggle = document.getElementById(
      "darkMode"
    ) as HTMLInputElement;
    if (darkModeToggle) {
      darkModeToggle.addEventListener("change", () => {
        this.toggleDarkMode(darkModeToggle.checked);
      });
    }

    document
      .getElementById("saveSettings")
      ?.addEventListener("click", () => this.saveAllSettings());
    document
      .getElementById("resetSettings")
      ?.addEventListener("click", () => this.resetSettings());
  }

  private pendingChanges: { [key: string]: any } = {};

  private trackChange(
    key: string,
    element: HTMLInputElement | HTMLSelectElement
  ): void {
    let value: any;

    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      value = element.checked;
    } else {
      value = element.value;
    }

    this.pendingChanges[key] = value;
  }

  private toggleDarkMode(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }

  private async saveSetting(
    key: string,
    element: HTMLInputElement | HTMLSelectElement
  ): Promise<void> {
    try {
      let value: any;

      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        value = element.checked;
      } else {
        value = element.value;
      }

      await savePreferences({ [key]: value });
      this.showStatus("Settings saved", "success");
    } catch (error) {
      this.showStatus("Failed to save setting", "error");
    }
  }

  private async saveAllSettings(): Promise<void> {
    if (Object.keys(this.pendingChanges).length === 0) {
      this.showStatus("No changes to save", "error");
      return;
    }

    try {
      await savePreferences(this.pendingChanges);
      this.pendingChanges = {};
      this.showStatus("Settings saved successfully", "success");
    } catch (error) {
      this.showStatus("Failed to save settings", "error");
    }
  }

  private async exportSettings(): Promise<void> {
    try {
      const preferences = await getPreferences();
      const dataStr = JSON.stringify(preferences, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = "tutorai-settings.json";
      link.click();

      this.showStatus("Settings exported successfully", "success");
    } catch (error) {
      this.showStatus("Failed to export settings", "error");
    }
  }

  private importSettings(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const settings = JSON.parse(text) as Partial<UserPreferences>;

        await savePreferences(settings);
        await this.loadSettings();

        this.showStatus("Settings imported successfully", "success");
      } catch (error) {
        this.showStatus(
          "Failed to import settings. Please check the file format.",
          "error"
        );
      }
    };

    input.click();
  }

  private async resetSettings(): Promise<void> {
    if (!confirm("Are you sure you want to reset all settings to defaults?")) {
      return;
    }

    try {
      const defaultPreferences: UserPreferences = {
        panelPosition: "bottom-right",
        darkMode: false,
        fontSize: "medium",
        contestSafeMode: true,
        neverUploadToRemote: true,
        openaiApiKey: "",
        anthropicApiKey: "",
        geminiApiKey: "",
        claudeApiKey: "",
        panelVisible: false,
      };

      const requiredFields = [
        "panelPosition",
        "darkMode",
        "fontSize",
        "panelVisible",
      ];
      for (const field of requiredFields) {
        if (!(field in defaultPreferences)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      await savePreferences(defaultPreferences);
      await this.loadSettings();

      this.showStatus("Settings reset to defaults", "success");
    } catch (error) {
      this.showStatus("Failed to reset settings", "error");
    }
  }

  private showStatus(message: string, type: "success" | "error"): void {
    const status = document.getElementById("status") as HTMLElement;
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = "block";

    setTimeout(() => {
      status.style.display = "none";
    }, 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new OptionsManager();
});
