import { readProblem } from "./tools/reader";
import { LeetHelperOverlay } from "./components/overlay";
import { getPreferences, isContestPage, debounce } from "./tools/utils";
import { Problem, HintResponse } from "./types";

class LeetHelperContent {
  private overlay!: LeetHelperOverlay;
  private preferences: any;
  private currentProblem: Problem | null = null;
  private isInitialized = false;
  private mutationObserver: MutationObserver | null = null;
  private debouncedProcessPage!: () => void;

  constructor() {
    try {
      this.overlay = new LeetHelperOverlay();
      this.preferences = {};
      this.debouncedProcessPage = debounce(() => this.processPage(), 1000);
      this.initialize();
    } catch (error) {}
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.preferences = await getPreferences();
    this.setupKeyboardShortcuts();
    this.setupMutationObserver();

    if (isContestPage()) {
      this.showContestNotice();
      return;
    }

    if (this.preferences.panelVisible) {
      await this.processPage();
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

  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldProcess = false;

      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (
                element.querySelector &&
                (element.querySelector(
                  '[data-track-load="description_content"]'
                ) ||
                  element.querySelector("h1") ||
                  element.querySelector('[data-e2e-locator="problem-title"]'))
              ) {
                shouldProcess = true;
                break;
              }
            }
          }
        }
      }

      if (shouldProcess) {
        this.debouncedProcessPage();
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
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
      <strong>TUTORAI</strong><br>
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

    if (this.preferences.localServerEnabled) {
      if (!this.preferences.openaiApiKey) {
        return;
      }
      await this.fetchHints(problem);
    }
  }

  private async fetchHints(problem: Problem): Promise<void> {
    try {
      this.overlay.showLoading();

      await this.overlay.updateContent({} as HintResponse, problem);

      this.overlay.hideLoading();
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
      <strong>TUTORAI</strong><br>
      Server is slow or unresponsive. Try refreshing the page or check your OpenAI API key.
    `;

    document.body.appendChild(notice);

    setTimeout(() => {
      if (notice.parentNode) {
        notice.parentNode.removeChild(notice);
      }
    }, 5000);
  }

  private showTimeoutNotice(): void {
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
      <strong>TUTORAI</strong><br>
      Request timed out. AI generation is taking longer than expected. Try the chat feature instead.
    `;

    document.body.appendChild(notice);

    setTimeout(() => {
      if (notice.parentNode) {
        notice.parentNode.removeChild(notice);
      }
    }, 5000);
  }

  private showServerConnectionError(): void {
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
      <strong>TUTORAI</strong><br>
      Cannot connect to local server. Make sure the server is running at ${this.preferences.serverUrl}
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

    if (!this.currentProblem) {
      this.processPage().then(() => {
        this.overlay.toggle();
      });
    } else {
      this.overlay.toggle();
    }
  }

  public destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.overlay) {
      this.overlay.destroy();
    }
  }
}

let leetHelper: LeetHelperContent | null = null;
let isInitializing = false;

function initializeLeetHelper() {
  if (!leetHelper && !isInitializing) {
    isInitializing = true;
    try {
      leetHelper = new LeetHelperContent();
    } catch (error) {
      // Failed to initialize TUTORAI
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
        // Give a small delay for initialization
        setTimeout(() => {
          if (leetHelper) {
            leetHelper.toggleOverlay();
          }
        }, 100);
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

// Initialize when the script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeLeetHelper);
} else {
  initializeLeetHelper();
}

window.addEventListener("beforeunload", () => {
  if (leetHelper) {
    leetHelper.destroy();
  }
});
