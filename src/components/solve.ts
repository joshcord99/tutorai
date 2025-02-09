import { Problem, UserPreferences } from "../types";
import { savePreferences } from "../tools/utils";
import { marked } from "marked";

export class SolveComponent {
  private container: HTMLElement;
  private config: any;
  private currentProblem: Problem | null = null;
  private selectedLanguage: string = "python";
  private selectedModel: string = "gpt-3.5-turbo";
  private preferences: UserPreferences;
  private isLoading: boolean = false;

  constructor(
    container: HTMLElement,
    config: any,
    preferences: UserPreferences
  ) {
    this.container = container;
    this.config = config;
    this.preferences = preferences;
    this.setupEventListeners();
  }

  public updateContent(problem: Problem): void {
    this.currentProblem = problem;
  }

  public setSelectedLanguage(language: string): void {
    this.selectedLanguage = language;
    this.updateLanguageDropdowns();
  }

  public setSelectedModel(model: string): void {
    this.selectedModel = model;
  }

  private setupEventListeners(): void {
    const revealBtn = this.container.querySelector(
      ".lh-reveal-solution"
    ) as HTMLElement;
    const languageDropdowns = this.container.querySelectorAll(
      ".lh-language-dropdown"
    );

    if (revealBtn) {
      revealBtn.addEventListener("click", this.revealSolution.bind(this));
    }

    languageDropdowns.forEach((dropdown) => {
      dropdown.addEventListener("change", (e) => {
        const target = e.target as HTMLSelectElement;
        this.selectedLanguage = target.value;
        this.updateLanguageDropdowns();
      });
    });
  }

  private updateLanguageDropdowns(): void {
    const dropdowns = this.container.querySelectorAll(
      ".lh-language-dropdown"
    ) as NodeListOf<HTMLSelectElement>;

    dropdowns.forEach((dropdown) => {
      dropdown.value = this.selectedLanguage;
    });
  }

  private async revealSolution(): Promise<void> {
    const locked = this.container.querySelector(
      ".lh-solution-locked"
    ) as HTMLElement;
    const content = this.container.querySelector(
      ".lh-solution-content"
    ) as HTMLElement;

    if (
      confirm(
        "Are you sure you want to reveal the solution? This may reduce the learning benefit."
      )
    ) {
      locked.style.display = "none";
      content.style.display = "block";

      await this.generateSolutionInLanguage(this.selectedLanguage);
    }
  }

  public async generateSolutionInLanguage(language: string): Promise<void> {
    if (!this.currentProblem) {
      return;
    }

    const apiKey = this.getApiKeyForModel(this.selectedModel);
    if (!apiKey) {
      this.showModelKeyError(this.selectedModel);
      return;
    }

    try {
      this.showLoading();

      const requestBody = {
        problem: this.currentProblem,
        language: language,
        user_api_key: this.preferences.openaiApiKey || null,
      };

      const response = await fetch(`${this.preferences.serverUrl}/solution`, {
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

      const solutionElement = this.container.querySelector(
        ".lh-solution"
      ) as HTMLElement;
      if (solutionElement) {
        solutionElement.innerHTML = marked.parse(data.solution);
      }
    } catch (error) {
      this.showError("Failed to generate solution. Please try again.");
    } finally {
      this.hideLoading();
    }
  }

  private getApiKeyForModel(model: string): string | null {
    switch (model) {
      case "gpt-3.5-turbo":
      case "gpt-4":
        return this.preferences.openaiApiKey || null;
      case "gemini":
        return this.preferences.geminiApiKey || null;
      default:
        return this.preferences.openaiApiKey || null;
    }
  }

  private showModelKeyError(model: string): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "lh-error-message";
    errorDiv.textContent = `Please add your ${model} API key in the extension options.`;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  private showLoading(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    const content = this.container.querySelector(
      ".lh-solution-content"
    ) as HTMLElement;
    if (content) {
      content.classList.add("loading");

      const loadingOverlay = document.createElement("div");
      loadingOverlay.className = "lh-loading-overlay";
      loadingOverlay.innerHTML = `
        <div class="lh-spinner"></div>
        <div class="lh-loading-text">Generating solution...</div>
      `;

      content.appendChild(loadingOverlay);
    }
  }

  private hideLoading(): void {
    if (!this.isLoading) return;

    this.isLoading = false;
    const content = this.container.querySelector(
      ".lh-solution-content"
    ) as HTMLElement;
    if (content) {
      content.classList.remove("loading");

      const loadingOverlay = content.querySelector(".lh-loading-overlay");
      if (loadingOverlay) {
        loadingOverlay.remove();
      }
    }
  }

  private showError(message: string): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "lh-error-message";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  public static createHTML(): string {
    return `
      <div class="lh-solution-locked">
        <p>Solution is hidden to encourage independent problem solving.</p>
        <div class="lh-language-selector">
          <label for="lh-solution-language">Language:</label>
          <select id="lh-solution-language" class="lh-language-dropdown">
            <option value="python">Python</option>
            <option value="python3">Python3</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="csharp">C#</option>
            <option value="php">PHP</option>
            <option value="swift">Swift</option>
            <option value="kotlin">Kotlin</option>
            <option value="dart">Dart</option>
            <option value="go">Go</option>
            <option value="ruby">Ruby</option>
            <option value="scala">Scala</option>
            <option value="rust">Rust</option>
            <option value="racket">Racket</option>
            <option value="erlang">Erlang</option>
            <option value="elixir">Elixir</option>
          </select>
        </div>
        <button class="lh-btn lh-reveal-solution">Reveal Solution</button>
      </div>
      <div class="lh-solution-content" style="display: none;">
        <div class="lh-solution-header">
          <div class="lh-language-selector">
            <label for="lh-solution-language-content">Language:</label>
            <select id="lh-solution-language-content" class="lh-language-dropdown">
              <option value="python">Python</option>
              <option value="python3">Python3</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="csharp">C#</option>
              <option value="php">PHP</option>
              <option value="swift">Swift</option>
              <option value="kotlin">Kotlin</option>
              <option value="dart">Dart</option>
              <option value="go">Go</option>
              <option value="ruby">Ruby</option>
              <option value="scala">Scala</option>
              <option value="rust">Rust</option>
              <option value="racket">Racket</option>
              <option value="erlang">Erlang</option>
              <option value="elixir">Elixir</option>
            </select>
          </div>
        </div>
        <pre class="lh-solution"></pre>
      </div>
    `;
  }
}
