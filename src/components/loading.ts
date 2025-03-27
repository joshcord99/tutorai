export interface LoadingConfig {
    container: HTMLElement;
    message?: string;
    showSpinner?: boolean;
    overlay?: boolean;
  }
  
  export class LoadingComponent {
    private container: HTMLElement;
    private config: LoadingConfig;
    private loadingElement: HTMLElement | null = null;
    private isVisible = false;
  
    constructor(config: LoadingConfig) {
      this.container = config.container;
      this.config = {
        message: "Loading...",
        showSpinner: true,
        overlay: false,
        ...config,
      };
    }
  
    public show(message?: string): void {
      if (this.isVisible) return;
  
      this.isVisible = true;
      const loadingMessage = message || this.config.message || "Loading...";
  
      if (this.config.overlay) {
        this.createOverlayLoading(loadingMessage);
      } else {
        this.createInlineLoading(loadingMessage);
      }
    }
  
    public hide(): void {
      if (!this.isVisible || !this.loadingElement) return;
  
      this.isVisible = false;
      if (this.loadingElement.parentNode) {
        this.loadingElement.parentNode.removeChild(this.loadingElement);
      }
      this.loadingElement = null;
    }
  
    public updateMessage(message: string): void {
      if (!this.isVisible || !this.loadingElement) return;
  
      const messageElement =
        this.loadingElement.querySelector(".lh-loading-text");
      if (messageElement) {
        messageElement.textContent = message;
      }
    }
  
    public isShown(): boolean {
      return this.isVisible;
    }
  
    private createOverlayLoading(message: string): void {
      this.loadingElement = document.createElement("div");
      this.loadingElement.className = "lh-loading-overlay";
  
      let html = "";
  
      if (this.config.showSpinner) {
        html += '<div class="lh-spinner"></div>';
      }
  
      html += `<div class="lh-loading-text">${message}</div>`;
  
      this.loadingElement.innerHTML = html;
      this.container.appendChild(this.loadingElement);
    }
  
    private createInlineLoading(message: string): void {
      this.loadingElement = document.createElement("div");
      this.loadingElement.className = "lh-loading-inline";
  
      let html = '<div class="lh-loading-content">';
  
      if (this.config.showSpinner) {
        html += '<div class="lh-spinner-small"></div>';
      }
  
      html += `<span class="lh-loading-text">${message}</span>`;
      html += "</div>";
  
      this.loadingElement.innerHTML = html;
      this.container.appendChild(this.loadingElement);
    }
  
    public static createSpinner(
      parent: HTMLElement,
      size: "small" | "medium" | "large" = "medium"
    ): HTMLElement {
      const spinner = document.createElement("div");
      spinner.className = `lh-spinner lh-spinner-${size}`;
      parent.appendChild(spinner);
      return spinner;
    }
  
    public static removeSpinner(spinner: HTMLElement): void {
      if (spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
      }
    }
  }
  