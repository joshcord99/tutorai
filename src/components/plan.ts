import { AIClient, AIConfig } from "../tools/serverless-logic";

interface PlanConfig {
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

      const aiConfig: AIConfig = {
        selectedModel: this.config.selectedModel,
        getApiKeyForModel: this.config.getApiKeyForModel,
      };

      const aiClient = new AIClient(aiConfig);

      const tags = this.inferTags(this.config.currentProblem);
      const plan = await aiClient.generatePlan(
        this.config.currentProblem,
        tags
      );
      this.displayPlan(plan);
    } catch (error) {
      this.showError("Failed to generate plan. Please try again.");
    } finally {
      this.isLoading = false;
      this.hideLoading();
      this.config.finishComponentLoading?.("plan");
    }
  }

  private inferTags(problem: any): string[] {
    const text = `${problem.title} ${problem.description}`.toLowerCase();
    const tags = [];

    if (
      text.includes("array") ||
      text.includes("list") ||
      text.includes("sequence")
    ) {
      tags.push("array");
    }
    if (
      text.includes("string") ||
      text.includes("text") ||
      text.includes("character")
    ) {
      tags.push("string");
    }
    if (
      text.includes("hash") ||
      text.includes("map") ||
      text.includes("dictionary")
    ) {
      tags.push("hash map");
    }
    if (
      text.includes("stack") ||
      text.includes("push") ||
      text.includes("pop")
    ) {
      tags.push("stack");
    }
    if (
      text.includes("queue") ||
      text.includes("heap") ||
      text.includes("priority")
    ) {
      tags.push("heap");
    }
    if (
      text.includes("tree") ||
      text.includes("node") ||
      text.includes("binary")
    ) {
      tags.push("tree");
    }
    if (
      text.includes("graph") ||
      text.includes("edge") ||
      text.includes("vertex")
    ) {
      tags.push("graph");
    }
    if (
      text.includes("two pointer") ||
      text.includes("two-pointer") ||
      text.includes("pointer")
    ) {
      tags.push("two pointers");
    }
    if (text.includes("binary search") || text.includes("search")) {
      tags.push("binary search");
    }
    if (
      text.includes("bfs") ||
      text.includes("breadth") ||
      text.includes("level")
    ) {
      tags.push("BFS");
    }
    if (
      text.includes("dfs") ||
      text.includes("depth") ||
      text.includes("recursion")
    ) {
      tags.push("DFS");
    }
    if (
      text.includes("dynamic programming") ||
      text.includes("dp") ||
      text.includes("memoization")
    ) {
      tags.push("dynamic programming");
    }
    if (text.includes("greedy") || text.includes("optimal")) {
      tags.push("greedy");
    }
    if (
      text.includes("math") ||
      text.includes("mathematical") ||
      text.includes("number")
    ) {
      tags.push("math");
    }

    return tags.length > 0 ? tags.slice(0, 5) : ["array", "string"];
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

    const isStepByStepPlan =
      /Step-by-step Plan/i.test(plan) || /Step \d+:/i.test(plan);

    if (isStepByStepPlan) {
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
    } else {
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
