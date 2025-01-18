interface EdgeCasesConfig {
    serverUrl: string;
    selectedModel: string;
    getApiKeyForModel: (model: string) => string | null;
    showModelKeyError: (model: string) => void;
    currentProblem: any;
    getCurrentLanguage: () => string;
    collectDOMElements: () => any;
  }
  
  export class EdgeCasesComponent {
    private container: HTMLElement;
    private config: EdgeCasesConfig;
    private isLoading = false;
  
    constructor(container: HTMLElement, config: EdgeCasesConfig) {
      console.log('[EdgeCasesComponent] Initializing with container:', container);
      this.container = container;
      this.config = config;
      this.setupEdgeCasesUI();
    }
  
    private setupEdgeCasesUI(): void {
      console.log('[EdgeCasesComponent] Setting up UI');
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
        console.log('[EdgeCasesComponent] Replacing existing edge cases element');
        existingEdgeCases.parentNode?.replaceChild(
          edgeCasesContainer,
          existingEdgeCases
        );
      } else {
        console.log('[EdgeCasesComponent] Appending new edge cases container');
        this.container.appendChild(edgeCasesContainer);
      }

      this.setupEventListeners();
    }
  
    private setupEventListeners(): void {
      console.log('[EdgeCasesComponent] Setting up event listeners');
      const regenerateBtn = this.container.querySelector(
        ".lh-regenerate-edge-cases"
      ) as HTMLElement;
      if (regenerateBtn) {
        console.log('[EdgeCasesComponent] Found regenerate button, adding click listener');
        regenerateBtn.addEventListener("click", () => this.generateEdgeCases());
      } else {
        console.warn('[EdgeCasesComponent] Regenerate button not found');
      }
    }
  
        public async generateEdgeCases(): Promise<void> {
      console.log('[EdgeCasesComponent] generateEdgeCases called');
      if (this.isLoading) {
        console.log('[EdgeCasesComponent] Already loading, skipping request');
        return;
      }
      if (!this.config.currentProblem) {
        console.warn('[EdgeCasesComponent] No current problem available');
        return;
      }

      console.log('[EdgeCasesComponent] Starting edge cases generation');
      this.isLoading = true;
      this.showLoading();
  
      try {
        console.log('[EdgeCasesComponent] Checking API key for model:', this.config.selectedModel);
        const apiKey = this.config.getApiKeyForModel(this.config.selectedModel);
        if (!apiKey) {
          console.error('[EdgeCasesComponent] No API key found for model:', this.config.selectedModel);
          this.config.showModelKeyError(this.config.selectedModel);
          return;
        }
        console.log('[EdgeCasesComponent] API key found, proceeding with request');
  
        const requestBody = {
          problem: this.config.currentProblem,
          current_language: this.config.getCurrentLanguage(),
          dom_elements: this.config.collectDOMElements(),
          model: this.config.selectedModel,
          user_api_key: this.config.getApiKeyForModel(
            this.config.selectedModel
          ),
        };
        console.log('[EdgeCasesComponent] Making request to:', `${this.config.serverUrl}/edge-cases`);
        console.log('[EdgeCasesComponent] Request body:', requestBody);
        
        const response = await fetch(`${this.config.serverUrl}/edge-cases`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
  
                console.log('[EdgeCasesComponent] Response status:', response.status);
        if (!response.ok) {
          console.error('[EdgeCasesComponent] HTTP error:', response.status, response.statusText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[EdgeCasesComponent] Response data:', data);
        this.displayEdgeCases(data.edge_cases);
      } catch (error) {
        console.error('[EdgeCasesComponent] Error generating edge cases:', error);
        this.showError("Failed to generate edge cases. Please try again.");
      } finally {
        console.log('[EdgeCasesComponent] Generation completed, resetting loading state');
        this.isLoading = false;
        this.hideLoading();
      }
    }
  
    private displayEdgeCases(edgeCases: string[]): void {
      console.log('[EdgeCasesComponent] Displaying edge cases:', edgeCases);
      const edgeCasesList = this.container.querySelector(
        ".lh-edge-cases"
      ) as HTMLElement;
      if (edgeCasesList) {
        edgeCasesList.innerHTML = "";
        edgeCases.forEach((edgeCase, index) => {
          console.log(`[EdgeCasesComponent] Adding edge case ${index + 1}:`, edgeCase);
          const li = document.createElement("li");
          li.textContent = edgeCase;
          edgeCasesList.appendChild(li);
        });
        console.log('[EdgeCasesComponent] Edge cases display completed');
      } else {
        console.warn('[EdgeCasesComponent] Edge cases list element not found');
      }
    }
  
    private showLoading(): void {
      console.log('[EdgeCasesComponent] Showing loading state');
      const edgeCasesList = this.container.querySelector(
        ".lh-edge-cases"
      ) as HTMLElement;
      if (edgeCasesList) {
        edgeCasesList.innerHTML = "<li>Generating edge cases...</li>";
        console.log('[EdgeCasesComponent] Loading message displayed');
      } else {
        console.warn('[EdgeCasesComponent] Edge cases list not found for loading display');
      }
    }
  
    private hideLoading(): void {
      console.log('[EdgeCasesComponent] Hiding loading state');
    }
  
    private showError(message: string): void {
      console.error('[EdgeCasesComponent] Showing error message:', message);
      const edgeCasesList = this.container.querySelector(
        ".lh-edge-cases"
      ) as HTMLElement;
      if (edgeCasesList) {
        edgeCasesList.innerHTML = `<li>${message}</li>`;
        console.log('[EdgeCasesComponent] Error message displayed');
      } else {
        console.warn('[EdgeCasesComponent] Edge cases list not found for error display');
      }
    }
  
    public updateConfig(newConfig: Partial<EdgeCasesConfig>): void {
      console.log('[EdgeCasesComponent] Updating config with:', newConfig);
      this.config = { ...this.config, ...newConfig };
      console.log('[EdgeCasesComponent] Config updated successfully');
    }
  
        public getEdgeCases(): string[] {
      console.log('[EdgeCasesComponent] Getting current edge cases');
      const edgeCasesList = this.container.querySelector(
        ".lh-edge-cases"
      ) as HTMLElement;
      if (!edgeCasesList) {
        console.warn('[EdgeCasesComponent] Edge cases list not found, returning empty array');
        return [];
      }

      const edgeCases = Array.from(edgeCasesList.children).map((li) => li.textContent || "");
      console.log('[EdgeCasesComponent] Retrieved edge cases:', edgeCases);
      return edgeCases;
    }
  }
  