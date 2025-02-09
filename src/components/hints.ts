interface HintsConfig {
  serverUrl: string;
  selectedModel: string;
  getApiKeyForModel: (model: string) => string | null;
  showModelKeyError: (model: string) => void;
  currentProblem: any;
  getCurrentLanguage: () => string;
  collectDOMElements: () => any;
  finishComponentLoading?: (componentName: string) => void;
}

export class HintsComponent {
  private container: HTMLElement;
  private config: HintsConfig;
  private isLoading = false;

  constructor(container: HTMLElement, config: HintsConfig) {
    this.container = container;
    this.config = config;
    this.setupHintsUI();
  }

  private setupHintsUI(): void {
    const hintsContainer = document.createElement("div");
    hintsContainer.className = "lh-hints-container";
    hintsContainer.innerHTML = `
        <div class="lh-hints-content">
          <div class="lh-hints-header">
            <h3>Hints</h3>
            <button class="lh-btn lh-regenerate-hints">Regenerate</button>
          </div>
          <div class="lh-hints-body">
            <div class="lh-hints-list"></div>
          </div>
        </div>
      `;

    const existingHints = this.container.querySelector(".lh-hints-list");
    if (existingHints) {
      existingHints.parentNode?.replaceChild(hintsContainer, existingHints);
    } else {
      this.container.appendChild(hintsContainer);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const regenerateBtn = this.container.querySelector(
      ".lh-regenerate-hints"
    ) as HTMLElement;
    if (regenerateBtn) {
      regenerateBtn.addEventListener("click", () => this.generateHints());
    }
  }

  public async generateHints(): Promise<void> {
    if (this.isLoading || !this.config.currentProblem) return;

    this.isLoading = true;
    this.showLoading();

    try {
      const apiKey = this.config.getApiKeyForModel(this.config.selectedModel);
      if (!apiKey) {
        this.config.showModelKeyError(this.config.selectedModel);
        return;
      }

      const response = await fetch(`${this.config.serverUrl}/hints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem: this.config.currentProblem,
          current_language: this.config.getCurrentLanguage(),
          dom_elements: this.config.collectDOMElements(),
          model: this.config.selectedModel,
          user_api_key: this.config.getApiKeyForModel(
            this.config.selectedModel
          ),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.displayHints(data.hints);
    } catch (error) {
      this.showError("Failed to generate hints. Please try again.");
    } finally {
      this.isLoading = false;
      this.hideLoading();
      this.config.finishComponentLoading?.("hints");
    }
  }

  public displayHints(hints: string[]): void {
    const hintsList = this.container.querySelector(
      ".lh-hints-list"
    ) as HTMLElement;
    if (hintsList) {
      hintsList.innerHTML = "";

      const combinedHints = hints.join("\n");
      const formattedHints = this.formatHints(combinedHints);
      hintsList.innerHTML = formattedHints;
    }
  }

  private formatHints(hints: string): string {
    if (!hints || hints.trim() === "") {
      return '<div class="lh-hints-error">No hints generated. Please try again.</div>';
    }

    let formattedHints = hints.trim();

    const lines = formattedHints.split("\n");
    const result: string[] = [];
    let currentItem: string[] = [];
    let inNumberedItem = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isNumberedLine = /^\d+\.\s*/.test(line);

      if (isNumberedLine) {
        if (inNumberedItem && currentItem.length > 0) {
          result.push("<li>" + currentItem.join("<br>") + "</li>");
        }
        currentItem = [line];
        inNumberedItem = true;
      } else if (inNumberedItem) {
        currentItem.push(line);
      } else {
        result.push(line);
      }
    }

    if (inNumberedItem && currentItem.length > 0) {
      result.push("<li>" + currentItem.join("<br>") + "</li>");
    }

    formattedHints = result.join("\n");

    if (formattedHints.includes("<li>")) {
      formattedHints = '<ol class="lh-hints-steps">' + formattedHints + "</ol>";
    }

    formattedHints = formattedHints
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");

    return formattedHints;
  }

  private showLoading(): void {
    const hintsList = this.container.querySelector(
      ".lh-hints-list"
    ) as HTMLElement;
    if (hintsList) {
      hintsList.innerHTML =
        "<div class='lh-hint-item'>Generating hints...</div>";
    }
  }

  private hideLoading(): void {}

  public showError(message: string): void {
    const hintsList = this.container.querySelector(
      ".lh-hints-list"
    ) as HTMLElement;
    if (hintsList) {
      hintsList.innerHTML = `<div class='lh-hint-item'>${message}</div>`;
    }
  }

  public updateConfig(newConfig: Partial<HintsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getHints(): string[] {
    const hintsList = this.container.querySelector(
      ".lh-hints-list"
    ) as HTMLElement;
    if (!hintsList) return [];

    return Array.from(hintsList.children).map((hintDiv) => {
      const textDiv = hintDiv.querySelector(".lh-hint-text");
      return textDiv?.textContent || "";
    });
  }
}
