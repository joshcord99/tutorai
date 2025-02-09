interface PlanConfig {
  serverUrl: string;
  selectedModel: string;
  getApiKeyForModel: (model: string) => string | null;
  showModelKeyError: (model: string) => void;
  currentProblem: any;
  getCurrentLanguage: () => string;
  collectDOMElements: () => any;
  finishComponentLoading?: (componentName: string) => void;
}

export class PlanComponent {
  private container: HTMLElement;
  private config: PlanConfig;
  private isLoading = false;

  constructor(container: HTMLElement, config: PlanConfig) {
    this.container = container;
    this.config = config;
    this.setupPlanUI();
  }

  private setupPlanUI(): void {
    const planContainer = document.createElement("div");
    planContainer.className = "lh-plan-container";
    planContainer.innerHTML = `
        <div class="lh-plan-content">
          <div class="lh-plan-header">
            <h3>Plan</h3>
            <button class="lh-btn lh-regenerate-plan">Regenerate</button>
          </div>
          <div class="lh-plan-body">
            <pre class="lh-plan"></pre>
          </div>
        </div>
            `;

    const existingPlan = this.container.querySelector(".lh-plan");
    if (existingPlan) {
      existingPlan.parentNode?.replaceChild(planContainer, existingPlan);
    } else {
      this.container.appendChild(planContainer);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const regenerateBtn = this.container.querySelector(
      ".lh-regenerate-plan"
    ) as HTMLElement;
    if (regenerateBtn) {
      regenerateBtn.addEventListener("click", () => this.generatePlan());
    }
  }

  public async generatePlan(): Promise<void> {
    if (this.isLoading || !this.config.currentProblem) return;

    this.isLoading = true;
    this.showLoading();

    try {
      const apiKey = this.config.getApiKeyForModel(this.config.selectedModel);
      if (!apiKey) {
        this.config.showModelKeyError(this.config.selectedModel);
        return;
      }

      const response = await fetch(`${this.config.serverUrl}/plan`, {
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
      this.displayPlan(data.plan);
    } catch (error) {
      this.showError("Failed to generate plan. Please try again.");
    } finally {
      this.isLoading = false;
      this.hideLoading();
      this.config.finishComponentLoading?.("plan");
    }
  }

  public displayPlan(plan: string): void {
    const planElement = this.container.querySelector(".lh-plan") as HTMLElement;
    if (planElement) {
      const formattedPlan = this.formatPlanResponse(plan);
      planElement.innerHTML = formattedPlan;
    }
  }

  private formatPlanResponse(plan: string): string {
    if (!plan || plan.trim() === "") {
      return '<div class="lh-plan-error">No plan generated. Please try again.</div>';
    }

    let formattedPlan = plan.trim();

    const firstNumberedStepIndex = formattedPlan.search(/^\d+\.\s*/m);
    if (firstNumberedStepIndex !== -1) {
      formattedPlan = formattedPlan.substring(firstNumberedStepIndex);
    }

    formattedPlan = formattedPlan
      .replace(/\n\n+/g, "\n\n")
      .replace(/^(\d+\.\s*)/gm, "<li>$1")
      .replace(/(\n)(?=\d+\.\s*)/g, "</li>$1")
      .replace(/(\n\n)(?=\d+\.\s*)/g, "</li>$1")
      .replace(/(\n\n)(?=[A-Z][^a-z])/g, "</li>$1<h4>$2")
      .replace(/(\n)(?=[A-Z][^a-z])/g, "</li>$1<h4>$2")
      .replace(/([A-Z][^a-z].*?)(?=\n|$)/g, "$1</h4>");

    if (formattedPlan.includes("<li>")) {
      formattedPlan = '<ol class="lh-plan-steps">' + formattedPlan + "</ol>";
    }

    formattedPlan = formattedPlan
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>")
      .replace(/<br><br>/g, "</p><p>")
      .replace(/^/, "<p>")
      .replace(/$/, "</p>")
      .replace(/<p><\/p>/g, "");

    return formattedPlan;
  }

  private showLoading(): void {
    const planElement = this.container.querySelector(".lh-plan") as HTMLElement;
    if (planElement) {
      planElement.innerHTML = `
        <div class="lh-plan-loading">
          <div class="spinner"></div>
          <span>Generating plan...</span>
        </div>
      `;
    }
  }

  private hideLoading(): void {}

  public showError(message: string): void {
    const planElement = this.container.querySelector(".lh-plan") as HTMLElement;
    if (planElement) {
      planElement.innerHTML = `<div class="lh-plan-error">${message}</div>`;
    }
  }

  public updateConfig(newConfig: Partial<PlanConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getPlan(): string {
    const planElement = this.container.querySelector(".lh-plan") as HTMLElement;
    return planElement?.textContent || "";
  }
}
