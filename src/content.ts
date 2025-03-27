import { readProblem } from "./tools/reader";
import { LeetHelperOverlay } from "./components/overlay";
import { isContestPage } from "./tools/utils";
import { Problem, HintResponse } from "./types";

class LeetHelperContent {
  private overlay!: LeetHelperOverlay;
  private currentProblem: Problem | null = null;
  private isInitialized = false;

  constructor() {
    try {
      this.overlay = new LeetHelperOverlay();
      this.initialize();
    } catch (error) {}
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.setupKeyboardShortcuts();

    if (isContestPage()) {
      this.showContestNotice();
      return;
    }

    this.isInitialized = true;
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        e.preventDefault();
        this.toggleOverlay();
      }

      if (e.key === "Escape") {
        this.overlay.hide();
      }
    });
  }

  private showContestNotice(): void {
    const notice = document.createElement("div");
    notice.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 6px;
      padding: 12px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: #856404;
      z-index: 9999;
      max-width: 300px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    notice.innerHTML = `
      <strong>TutorAI</strong><br>
      Disabled on contest pages to ensure fair competition.
    `;

    document.body.appendChild(notice);

    setTimeout(() => {
      if (notice.parentNode) {
        notice.parentNode.removeChild(notice);
      }
    }, 5000);
  }

  private async processPage(): Promise<void> {
    if (isContestPage()) {
      return;
    }

    const problem = await readProblem();
    if (!problem) {
      return;
    }

    if (
      this.currentProblem &&
      this.currentProblem.title === problem.title &&
      this.currentProblem.url === problem.url
    ) {
      return;
    }

    this.currentProblem = problem;
  }

  private async fetchHints(problem: Problem): Promise<void> {
    try {
      this.overlay.showLoading();
      this.overlay.show();

      this.overlay
        .updateContent({} as HintResponse, problem)
        .then(() => {
          this.overlay.hideLoading();
        })
        .catch((error) => {
          this.overlay.hideLoading();
          this.showErrorNotice();
        });
    } catch (error) {
      this.overlay.hideLoading();
      this.showErrorNotice();
    }
  }

  private showErrorNotice(): void {
    const notice = document.createElement("div");
    notice.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      padding: 12px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: #721c24;
      z-index: 9999;
      max-width: 300px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    notice.innerHTML = `
      <strong>TutorAI</strong><br>
      Server is slow or unresponsive. Try refreshing the page or check your OpenAI API key.
    `;

    document.body.appendChild(notice);

    setTimeout(() => {
      if (notice.parentNode) {
        notice.parentNode.removeChild(notice);
      }
    }, 5000);
  }

  public toggleOverlay(): void {
    if (isContestPage()) {
      return;
    }

    if (!this.overlay) {
      return;
    }

    this.processPage().then(() => {
      if (this.currentProblem) {
        this.fetchHints(this.currentProblem);
      }
    });
  }

  public async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  public destroy(): void {
    if (this.overlay) {
      this.overlay.destroy();
    }
  }
}

let leetHelper: LeetHelperContent | null = null;
let isInitializing = false;

async function initializeLeetHelper() {
  if (!leetHelper && !isInitializing) {
    isInitializing = true;
    try {
      leetHelper = new LeetHelperContent();
      await leetHelper.waitForInitialization();
    } catch (error) {
    } finally {
      isInitializing = false;
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === "toggle") {
      if (!leetHelper) {
        initializeLeetHelper();
        setTimeout(() => {
          if (leetHelper) {
            leetHelper.toggleOverlay();
          }
        }, 0);
        sendResponse({ success: true });
      } else {
        leetHelper.toggleOverlay();
        sendResponse({ success: true });
      }
    }
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

const initializeWithDelay = () => {
  setTimeout(() => {
    try {
      initializeLeetHelper();
    } catch (error) {}
  }, 1000);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeWithDelay);
} else {
  initializeWithDelay();
}

window.addEventListener("beforeunload", () => {
  if (leetHelper) {
    leetHelper.destroy();
  }
});
