import { AIClient, AIConfig } from "../tools/serverless-logic";

interface EdgeCasesConfig {
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

  private setupEventListeners(): void {}

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

      const aiConfig: AIConfig = {
        selectedModel: this.config.selectedModel,
        getApiKeyForModel: this.config.getApiKeyForModel,
      };

      const aiClient = new AIClient(aiConfig);

      const edgeCases = await aiClient.generateEdgeCases(
        this.config.currentProblem
      );
      this.displayEdgeCases(edgeCases);
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
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>")
      .replace(/<br><br>/g, "</p><p>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>")
      .replace(/<p><\/p>/g, "");

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
}
