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

  private displayEdgeCases(edgeCases: string[]): void {
    const edgeCasesList = this.container.querySelector(
      ".lh-edge-cases"
    ) as HTMLElement;
    if (edgeCasesList) {
      edgeCasesList.innerHTML = "";
      edgeCases.forEach((edgeCase, index) => {
        const li = document.createElement("li");
        const formattedEdgeCase = this.formatEdgeCase(edgeCase);
        li.innerHTML = formattedEdgeCase;
        edgeCasesList.appendChild(li);
      });
    }
  }

  private formatEdgeCase(edgeCase: string): string {
    if (!edgeCase || edgeCase.trim() === "") {
      return "Empty edge case";
    }

    let formattedEdgeCase = edgeCase.trim();

    formattedEdgeCase = formattedEdgeCase
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");

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

  private showError(message: string): void {
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
