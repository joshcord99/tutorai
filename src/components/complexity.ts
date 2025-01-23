interface ComplexityConfig {
    serverUrl: string;
    selectedModel: string;
    getApiKeyForModel: (model: string) => string | null;
    showModelKeyError: (model: string) => void;
    currentProblem: any;
    getCurrentLanguage: () => string;
    collectDOMElements: () => any;
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
          return;
        }
  
        const data = await response.json();
        this.displayComplexity(data);
      } catch (error) {
        this.showError(
          "Failed to generate complexity analysis. Please try again."
        );
      } finally {
        this.isLoading = false;
        this.hideLoading();
      }
    }
  
    private displayComplexity(data: ComplexityData): void {
      const timeElement = this.container.querySelector(".lh-time") as HTMLElement;
      const spaceElement = this.container.querySelector(
        ".lh-space"
      ) as HTMLElement;
      const rationaleElement = this.container.querySelector(
        ".lh-rationale"
      ) as HTMLElement;
  
      if (timeElement) timeElement.textContent = data.time;
      if (spaceElement) spaceElement.textContent = data.space;
    }
  
    private showLoading(): void {
      const timeElement = this.container.querySelector(".lh-time") as HTMLElement;
      const spaceElement = this.container.querySelector(
        ".lh-space"
      ) as HTMLElement;
  
      if (timeElement) timeElement.textContent = "Analyzing...";
      if (spaceElement) spaceElement.textContent = "Analyzing...";
    }
  
    private hideLoading(): void {}
  
    private showError(message: string): void {
      const timeElement = this.container.querySelector(".lh-time") as HTMLElement;
      const spaceElement = this.container.querySelector(
        ".lh-space"
      ) as HTMLElement;
  
      if (timeElement) timeElement.textContent = "Error";
      if (spaceElement) spaceElement.textContent = "Error";
    }
  
    public updateConfig(newConfig: Partial<ComplexityConfig>): void {
      this.config = { ...this.config, ...newConfig };
    }
  
    public getComplexity(): ComplexityData {
      const timeElement = this.container.querySelector(".lh-time") as HTMLElement;
      const spaceElement = this.container.querySelector(
        ".lh-space"
      ) as HTMLElement;
  
      return {
        time: timeElement?.textContent || "",
        space: spaceElement?.textContent || "",
        rationale: "",
      };
    }
  }
  