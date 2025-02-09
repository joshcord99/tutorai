interface EdgeCasesConfig {
  serverUrl: string;
  selectedModel: string;
  getApiKeyForModel: (model: string) => string | null;
  showModelKeyError: (model: string) => void;
  currentProblem: any;
  getCurrentLanguage: () => string;
  collectDOMElements: () => any;
  finishComponentLoading?: (componentName: string) => void;
}

export class EdgeCasesComponent {
  private container: HTMLElement;
  private config: EdgeCasesConfig;
  private isLoading = false;

  constructor(container: HTMLElement, config: EdgeCasesConfig) {
    this.container = container;
    this.config = config;
    this.setupEdgeCasesUI();
  }

  private setupEdgeCasesUI(): void {
    const edgeCasesContainer = document.createElement("div");
    edgeCasesContainer.className = "lh-edge-cases-container";
    edgeCasesContainer.innerHTML = `
        <div class="lh-edge-cases-content">
          <div class="lh-edge-cases-header">
            <h3>Edge Cases</h3>
            <button class="lh-btn lh-regenerate-edge-cases">Regenerate</button>
          </div>
          <div class="lh-edge-cases-body">
            <ul class="lh-edge-cases"></ul>
          </div>
        </div>
      `;

    const existingEdgeCases = this.container.querySelector(".lh-edge-cases");
    if (existingEdgeCases) {
      existingEdgeCases.parentNode?.replaceChild(
        edgeCasesContainer,
        existingEdgeCases
      );
    } else {
      this.container.appendChild(edgeCasesContainer);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const regenerateBtn = this.container.querySelector(
      ".lh-regenerate-edge-cases"
    ) as HTMLElement;
    if (regenerateBtn) {
      regenerateBtn.addEventListener("click", () => this.generateEdgeCases());
    }
  }

  public async generateEdgeCases(): Promise<void> {
    if (this.isLoading) {
      return;
    }
    if (!this.config.currentProblem) {
      return;
    }

    this.isLoading = true;
    this.showLoading();

    try {
      const apiKey = this.config.getApiKeyForModel(this.config.selectedModel);
      if (!apiKey) {
        this.config.showModelKeyError(this.config.selectedModel);
        this.isLoading = false;
        this.hideLoading();
        return;
      }

      const requestBody = {
        problem: this.config.currentProblem,
        current_language: this.config.getCurrentLanguage(),
        dom_elements: this.config.collectDOMElements(),
        model: this.config.selectedModel,
        user_api_key: this.config.getApiKeyForModel(this.config.selectedModel),
      };

      const response = await fetch(`${this.config.serverUrl}/edge-cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.displayEdgeCases(data.edge_cases);
    } catch (error) {
      this.showError("Failed to generate edge cases. Please try again.");
    } finally {
      this.isLoading = false;
      this.hideLoading();
      this.config.finishComponentLoading?.("edge-cases");
    }
  }

  public displayEdgeCases(edgeCases: string[]): void {
    const edgeCasesList = this.container.querySelector(
      ".lh-edge-cases"
    ) as HTMLElement;
    if (edgeCasesList) {
      edgeCasesList.innerHTML = "";

      const combinedEdgeCases = edgeCases.join("\n");
      const formattedEdgeCases = this.formatEdgeCase(combinedEdgeCases);
      edgeCasesList.innerHTML = formattedEdgeCases;
    }
  }

  private formatEdgeCase(edgeCase: string): string {
    if (!edgeCase || edgeCase.trim() === "") {
      return '<div class="lh-edge-cases-error">No edge cases generated. Please try again.</div>';
    }

    let formattedEdgeCase = edgeCase.trim();

    const lines = formattedEdgeCase.split("\n");
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

    formattedEdgeCase = result.join("\n");

    if (formattedEdgeCase.includes("<li>")) {
      formattedEdgeCase =
        '<ol class="lh-edge-cases-steps">' + formattedEdgeCase + "</ol>";
    }

    formattedEdgeCase = formattedEdgeCase
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");

    return formattedEdgeCase;
  }

  private showLoading(): void {
    const edgeCasesList = this.container.querySelector(
      ".lh-edge-cases"
    ) as HTMLElement;
    if (edgeCasesList) {
      edgeCasesList.innerHTML = `
        <div class="lh-edge-cases-loading">
          <div class="spinner"></div>
          <span>Generating edge cases...</span>
        </div>
      `;
    }
  }

  private hideLoading(): void {}

  public showError(message: string): void {
    const edgeCasesList = this.container.querySelector(
      ".lh-edge-cases"
    ) as HTMLElement;
    if (edgeCasesList) {
      edgeCasesList.innerHTML = `<div class="lh-edge-cases-error">${message}</div>`;
    }
  }

  public updateConfig(newConfig: Partial<EdgeCasesConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getEdgeCases(): string[] {
    const edgeCasesList = this.container.querySelector(
      ".lh-edge-cases"
    ) as HTMLElement;
    if (!edgeCasesList) {
      return [];
    }

    const edgeCases = Array.from(edgeCasesList.children).map(
      (li) => li.textContent || ""
    );
    return edgeCases;
  }
}
