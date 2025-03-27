import { AIClient, AIConfig } from "../tools/serverless-logic";

interface HintsConfig {
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

      const aiConfig: AIConfig = {
        selectedModel: this.config.selectedModel,
        getApiKeyForModel: this.config.getApiKeyForModel,
      };

      const aiClient = new AIClient(aiConfig);

      const tags = this.inferTags(this.config.currentProblem);
      const hints = await aiClient.generateHints(
        this.config.currentProblem,
        tags
      );
      this.displayHints(hints);
    } catch (error) {
      this.showError("Failed to generate hints. Please try again.");
    } finally {
      this.isLoading = false;
      this.config.finishComponentLoading?.("hints");
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

    const isBulletedHints =
      /^-\s/.test(formattedHints) || /^\d+\.\s/.test(formattedHints);

    if (isBulletedHints) {
      const lines = formattedHints.split("\n");
      const result: string[] = [];
      let currentItem: string[] = [];
      let inNumberedItem = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isNumberedLine = /^\d+\.\s*/.test(line);
        const isBulletLine = /^-\s*/.test(line);

        if (isNumberedLine || isBulletLine) {
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
        formattedHints =
          '<ol class="lh-hints-steps">' + formattedHints + "</ol>";
      }
    } else {
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
        formattedHints =
          '<ol class="lh-hints-steps">' + formattedHints + "</ol>";
      }
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
}
