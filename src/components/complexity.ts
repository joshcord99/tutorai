interface ComplexityConfig {
  serverUrl: string;
  selectedModel: string;
  getApiKeyForModel: (model: string) => string | null;
  showModelKeyError: (model: string) => void;
  currentProblem: any;
  getCurrentLanguage: () => string;
  collectDOMElements: () => any;
  finishComponentLoading?: (componentName: string) => void;
}

interface ComplexityData {
  time: string;
  space: string;
  rationale: string;
}

export class ComplexityComponent {
  private container: HTMLElement;
  private config: ComplexityConfig;
  private isLoading = false;

  constructor(container: HTMLElement, config: ComplexityConfig) {
    this.container = container;
    this.config = config;
    this.setupComplexityUI();
  }

  private setupComplexityUI(): void {
    const complexityContainer = document.createElement("div");
    complexityContainer.className = "lh-complexity-container";
    complexityContainer.innerHTML = `
        <div class="lh-complexity-content">
          <div class="lh-complexity-header">
            <h3>Complexity Analysis</h3>
            <button class="lh-btn lh-regenerate-complexity">Regenerate</button>
          </div>
          <div class="lh-complexity-body">
            <div class="lh-complexity">
              <div class="lh-complexity-item">
                <strong>Time:</strong> <span class="lh-time"></span>
              </div>
              <div class="lh-complexity-item">
                <strong>Space:</strong> <span class="lh-space"></span>
              </div>
              <div class="lh-rationale"></div>
            </div>
          </div>
        </div>
      `;

    const existingComplexity = this.container.querySelector(".lh-complexity");
    if (existingComplexity) {
      existingComplexity.parentNode?.replaceChild(
        complexityContainer,
        existingComplexity
      );
    } else {
      this.container.appendChild(complexityContainer);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const regenerateBtn = this.container.querySelector(
      ".lh-regenerate-complexity"
    ) as HTMLElement;
    if (regenerateBtn) {
      regenerateBtn.addEventListener("click", () => this.generateComplexity());
    }
  }

  public async generateComplexity(): Promise<void> {
    if (this.isLoading || !this.config.currentProblem) return;

    this.isLoading = true;
    this.showLoading();

    try {
      const apiKey = this.config.getApiKeyForModel(this.config.selectedModel);
      if (!apiKey) {
        this.config.showModelKeyError(this.config.selectedModel);
        this.config.finishComponentLoading?.("complexity");
        return;
      }

      const response = await fetch(`${this.config.serverUrl}/complexity`, {
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
      this.displayComplexity(data.complexity);
    } catch (error) {
      this.showError(
        "Failed to generate complexity analysis. Please try again."
      );
    } finally {
      this.isLoading = false;
      this.hideLoading();
      this.config.finishComponentLoading?.("complexity");
    }
  }

  public displayComplexity(data: ComplexityData): void {
    const timeElement = this.container.querySelector(".lh-time") as HTMLElement;
    const spaceElement = this.container.querySelector(
      ".lh-space"
    ) as HTMLElement;
    const rationaleElement = this.container.querySelector(
      ".lh-rationale"
    ) as HTMLElement;

    if (timeElement) timeElement.textContent = data.time;
    if (spaceElement) spaceElement.textContent = data.space;
    if (rationaleElement) rationaleElement.textContent = data.rationale;
  }

  private showLoading(): void {
    const timeElement = this.container.querySelector(".lh-time") as HTMLElement;
    const spaceElement = this.container.querySelector(
      ".lh-space"
    ) as HTMLElement;
    const rationaleElement = this.container.querySelector(
      ".lh-rationale"
    ) as HTMLElement;

    if (timeElement) timeElement.textContent = "Analyzing...";
    if (spaceElement) spaceElement.textContent = "Analyzing...";
    if (rationaleElement)
      rationaleElement.textContent = "Generating complexity analysis...";
  }

  private hideLoading(): void {}

  public showError(message: string): void {
    const timeElement = this.container.querySelector(".lh-time") as HTMLElement;
    const spaceElement = this.container.querySelector(
      ".lh-space"
    ) as HTMLElement;
    const rationaleElement = this.container.querySelector(
      ".lh-rationale"
    ) as HTMLElement;

    if (timeElement) timeElement.textContent = "Error";
    if (spaceElement) spaceElement.textContent = "Error";
    if (rationaleElement) rationaleElement.textContent = message;
  }

  public updateConfig(newConfig: Partial<ComplexityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getComplexity(): ComplexityData {
    const timeElement = this.container.querySelector(".lh-time") as HTMLElement;
    const spaceElement = this.container.querySelector(
      ".lh-space"
    ) as HTMLElement;
    const rationaleElement = this.container.querySelector(
      ".lh-rationale"
    ) as HTMLElement;

    return {
      time: timeElement?.textContent || "",
      space: spaceElement?.textContent || "",
      rationale: rationaleElement?.textContent || "",
    };
  }
}
