
import {
    HintResponse,
    UserPreferences,
    PanelPosition,
    Problem,
  } from "../types";
  import {
    getPreferences,
    savePreferences,
    getPanelPosition,
    savePanelPosition,
  } from "../tools/utils";
  import { marked } from "marked";
  import { DisclaimerModal } from "./disclaimer";
  import { SolveComponent } from "./solve";
  
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
  
  export class LeetHelperOverlay {
    private container: HTMLElement;
    private isVisible = false;
    private isDragging = false;
    private dragOffset = { x: 0, y: 0 };
    private currentPosition: PanelPosition;
    private preferences: UserPreferences;
    private currentProblem: Problem | null = null;
    private isLoading = false;
    private selectedLanguage: string = "python";
    private selectedModel: string = "openai";
    private languageDetectionInterval: number | null = null;
    private boundEventHandlers: { [key: string]: any } = {};
    private disclaimerModal!: DisclaimerModal;
    private solveComponent!: SolveComponent;
    private userManuallyChangedLanguage: boolean = false;
    private chatHistory: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: number;
    }> = [];
  
    constructor() {
      this.container = this.createContainer();
      this.currentPosition = { x: 0, y: 0, width: 400, height: 500 };
      this.preferences = {
        panelPosition: "bottom-right",
        darkMode: false,
        fontSize: "medium",
        contestSafeMode: true,
        localServerEnabled: true,
        serverUrl: "http://127.0.0.1:5050",
        neverUploadToRemote: true,
        panelVisible: false,
      };
      this.disclaimerModal = new DisclaimerModal();
      document.body.appendChild(this.container);
      this.initialize();
    }
  
    private async initialize(): Promise<void> {
      this.preferences = await getPreferences();
      this.currentPosition = await getPanelPosition();
      this.applyTheme();
      this.setupEventListeners();
      this.positionPanel();
  
      const solveContainer = this.container.querySelector(
        '.lh-tab-pane[data-tab="solution"]'
      ) as HTMLElement;
      if (solveContainer) {
        this.solveComponent = new SolveComponent(
          solveContainer,
          this,
          this.preferences
        );
      }
    }
  
    private createContainer(): HTMLElement {
      const container = document.createElement("div");
      container.id = "leet-helper-overlay";
      container.className = "lh-container lh-light lh-medium";
      container.innerHTML = `
        <div class="lh-header">
          <div class="lh-logo">TUTORAI</div>
          <div class="lh-model-selector">
            <select id="lh-ai-model" class="lh-model-dropdown">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Claude</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>
          <div class="lh-controls">
            <button class="lh-btn lh-minimize" title="Minimize">_</button>
            <button class="lh-btn lh-close" title="Close">×</button>
          </div>
        </div>
        <div class="lh-content">
          <div class="lh-tabs">
            <button class="lh-tab active" data-tab="chat">Chat</button>
            <button class="lh-tab" data-tab="plan">Plan</button>
            <button class="lh-tab" data-tab="edge-cases">Edge Cases</button>
            <button class="lh-tab" data-tab="hints">Hints</button>
            <button class="lh-tab" data-tab="complexity">Complexity</button>
            <button class="lh-tab" data-tab="solution">Solve</button>
          </div>
          <div class="lh-tab-content">
            <div class="lh-tab-pane active" data-tab="chat">
              <div class="lh-chat-welcome">
                <button class="lh-btn lh-need-help-btn">Chat</button>
              </div>
              <div class="lh-chat" style="display: none;">
                <div class="lh-chat-messages"></div>
                <div class="lh-chat-input">
                  <input type="text" class="lh-chat-text" placeholder="Ask for hints or guidance...">
                  <button class="lh-btn lh-send-btn">Send</button>
                </div>
              </div>
            </div>
            <div class="lh-tab-pane" data-tab="plan">
              <pre class="lh-plan"></pre>
            </div>
            <div class="lh-tab-pane" data-tab="edge-cases">
              <ul class="lh-edge-cases"></ul>
            </div>
            <div class="lh-tab-pane" data-tab="hints">
              <div class="lh-hints-list"></div>
            </div>
            <div class="lh-tab-pane" data-tab="complexity">
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
            <div class="lh-tab-pane" data-tab="solution">
              ${SolveComponent.createHTML()}
            </div>
          </div>
        </div>
        <div class="lh-footer">
          <button class="lh-btn lh-disclaimer-btn">Disclaimer</button>
        </div>
      `;
      return container;
    }
  
    private setupEventListeners(): void {
      const header = this.container.querySelector(".lh-header") as HTMLElement;
      const minimizeBtn = this.container.querySelector(
        ".lh-minimize"
      ) as HTMLElement;
      const closeBtn = this.container.querySelector(".lh-close") as HTMLElement;
  
      const tabs = this.container.querySelectorAll(".lh-tab");
      const disclaimerBtn = this.container.querySelector(
        ".lh-disclaimer-btn"
      ) as HTMLElement;
  
      this.boundEventHandlers.startDrag = this.startDrag.bind(this);
      this.boundEventHandlers.onDrag = this.onDrag.bind(this);
      this.boundEventHandlers.stopDrag = this.stopDrag.bind(this);
  
      header.addEventListener("mousedown", this.boundEventHandlers.startDrag);
      document.addEventListener("mousemove", this.boundEventHandlers.onDrag);
      document.addEventListener("mouseup", this.boundEventHandlers.stopDrag);
  
      if (minimizeBtn) {
        minimizeBtn.addEventListener("click", this.toggleMinimize.bind(this));
      }
  
      if (closeBtn) {
        closeBtn.addEventListener("click", this.hide.bind(this));
      }
  
      const modelDropdown = this.container.querySelector(
        "#lh-ai-model"
      ) as HTMLSelectElement;
  
      if (modelDropdown) {
        modelDropdown.value = "openai";
  
        modelDropdown.addEventListener("change", () => {
          this.onModelChange(modelDropdown.value);
        });
      }
  
      tabs.forEach((tab) => {
        tab.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          this.switchTab(target.dataset.tab!);
        });
      });
      disclaimerBtn.addEventListener("click", () => this.disclaimerModal.show());
  
      const languageDropdown = this.container.querySelector(
        "#lh-solution-language"
      ) as HTMLSelectElement;
      const languageDropdownContent = this.container.querySelector(
        "#lh-solution-language-content"
      ) as HTMLSelectElement;
  
      if (languageDropdown) {
        let currentLanguage = this.getCurrentLanguage();
  
        if (!currentLanguage || currentLanguage === "") {
          currentLanguage = "python";
        }
  
        languageDropdown.value = currentLanguage;
  
        languageDropdown.addEventListener("change", () => {
          this.userManuallyChangedLanguage = true;
          this.onLanguageChange(languageDropdown.value);
        });
      }
  
      if (languageDropdownContent) {
        let currentLanguage = this.getCurrentLanguage();
  
        if (!currentLanguage || currentLanguage === "") {
          currentLanguage = "python";
        }
  
        languageDropdownContent.value = currentLanguage;
  
        languageDropdownContent.addEventListener("change", () => {
          this.userManuallyChangedLanguage = true;
          this.onLanguageChange(languageDropdownContent.value);
        });
      }
  
      this.setupLanguageDetection();
  
      const needHelpBtn = this.container.querySelector(
        ".lh-need-help-btn"
      ) as HTMLElement;
      const chatInput = this.container.querySelector(
        ".lh-chat-text"
      ) as HTMLInputElement;
      const sendBtn = this.container.querySelector(".lh-send-btn") as HTMLElement;
  
      if (needHelpBtn) {
        needHelpBtn.addEventListener("click", this.startChat.bind(this));
      }
  
      if (chatInput && sendBtn) {
        sendBtn.addEventListener("click", this.sendChatMessage.bind(this));
        chatInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            this.sendChatMessage();
          }
        });
      }
    }
  
    private startDrag(e: MouseEvent): void {
      this.isDragging = true;
      const rect = this.container.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;
      this.container.style.cursor = "grabbing";
    }
  
    private onDrag(e: MouseEvent): void {
      if (!this.isDragging) return;
  
      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;
  
      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;
      this.container.style.right = "auto";
      this.container.style.bottom = "auto";
    }
  
    private stopDrag(): void {
      if (!this.isDragging) return;
  
      this.isDragging = false;
      this.container.style.cursor = "grab";
  
      const rect = this.container.getBoundingClientRect();
      this.currentPosition.x = rect.left;
      this.currentPosition.y = rect.top;
      this.savePosition();
    }
  
    private switchTab(tabName: string): void {
      const tabs = this.container.querySelectorAll(".lh-tab");
      const panes = this.container.querySelectorAll(".lh-tab-pane");
  
      tabs.forEach((tab) => tab.classList.remove("active"));
      panes.forEach((pane) => pane.classList.remove("active"));
  
      this.container
        .querySelector(`[data-tab="${tabName}"]`)
        ?.classList.add("active");
      this.container
        .querySelector(`.lh-tab-pane[data-tab="${tabName}"]`)
        ?.classList.add("active");
    }
  
    private toggleMinimize(): void {
      const content = this.container.querySelector(".lh-content") as HTMLElement;
      const footer = this.container.querySelector(".lh-footer") as HTMLElement;
      const minimizeBtn = this.container.querySelector(
        ".lh-minimize"
      ) as HTMLElement;
      const isMinimized = this.container.classList.contains("lh-minimized");
  
      if (isMinimized) {
        this.container.classList.remove("lh-minimized");
        this.container.style.height = "500px";
        this.container.style.width = "400px";
        minimizeBtn.textContent = "_";
        minimizeBtn.title = "Minimize";
      } else {
        this.container.classList.add("lh-minimized");
        this.container.style.height = "50px";
        this.container.style.width = "200px";
        minimizeBtn.textContent = "□";
        minimizeBtn.title = "Restore";
      }
    }
  
    private positionPanel(): void {
      const { panelPosition } = this.preferences;
  
      switch (panelPosition) {
        case "top-right":
          this.container.style.top = "20px";
          this.container.style.right = "20px";
          this.container.style.bottom = "auto";
          this.container.style.left = "auto";
          break;
        case "top-left":
          this.container.style.top = "20px";
          this.container.style.left = "20px";
          this.container.style.bottom = "auto";
          this.container.style.right = "auto";
          break;
        case "bottom-left":
          this.container.style.bottom = "20px";
          this.container.style.left = "20px";
          this.container.style.top = "auto";
          this.container.style.right = "auto";
          break;
        default:
          this.container.style.bottom = "20px";
          this.container.style.right = "20px";
          this.container.style.top = "auto";
          this.container.style.left = "auto";
      }
    }
  
    private applyTheme(): void {
      const { darkMode, fontSize } = this.preferences;
  
      this.container.className = `lh-container ${darkMode ? "lh-dark" : "lh-light"} lh-${fontSize}`;
    }
  
    private savePosition(): void {
      savePanelPosition(this.currentPosition);
    }
  
    public show(): void {
      if (this.isVisible) return;
  
      this.isVisible = true;
      this.container.style.display = "block";
      this.savePreferences({ panelVisible: true });
  
      this.updateLanguageDropdowns();
    }
  
    public hide(): void {
      if (!this.isVisible) return;
  
      this.isVisible = false;
      this.container.style.display = "none";
      this.savePreferences({ panelVisible: false });
    }
  
    public destroy(): void {
      if (this.languageDetectionInterval) {
        clearInterval(this.languageDetectionInterval);
        this.languageDetectionInterval = null;
      }
  
      if (this.boundEventHandlers.onDrag) {
        document.removeEventListener("mousemove", this.boundEventHandlers.onDrag);
      }
      if (this.boundEventHandlers.stopDrag) {
        document.removeEventListener("mouseup", this.boundEventHandlers.stopDrag);
      }
  
      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
    }
  
    public toggle(): void {
      if (this.isVisible) {
        this.hide();
      } else {
        this.show();
      }
    }
  
    public updateContent(data: HintResponse, problem?: Problem): void {
      if (problem) {
        this.currentProblem = problem;
        if (this.solveComponent) {
          this.solveComponent.updateContent(problem);
        }
      }
  
      const hintsList = this.container.querySelector(
        ".lh-hints-list"
      ) as HTMLElement;
      const plan = this.container.querySelector(".lh-plan") as HTMLElement;
      const edgeCases = this.container.querySelector(
        ".lh-edge-cases"
      ) as HTMLElement;
      const time = this.container.querySelector(".lh-time") as HTMLElement;
      const space = this.container.querySelector(".lh-space") as HTMLElement;
      const rationale = this.container.querySelector(
        ".lh-rationale"
      ) as HTMLElement;
  
      hintsList.innerHTML = data.hints
        .map((hint) => `<div class="lh-hint">${marked.parse(hint)}</div>`)
        .join("");
      plan.innerHTML = marked.parse(data.plan);
  
      edgeCases.innerHTML = data.edge_cases
        .map((edge) => `<li>${marked.parse(edge)}</li>`)
        .join("");
      time.textContent = data.complexity.time;
      space.textContent = data.complexity.space;
      rationale.innerHTML = marked.parse(data.complexity.rationale);
    }
  
    private startChat(): void {
      const chatWelcome = this.container.querySelector(
        ".lh-chat-welcome"
      ) as HTMLElement;
      const chat = this.container.querySelector(".lh-chat") as HTMLElement;
      const chatMessages = this.container.querySelector(
        ".lh-chat-messages"
      ) as HTMLElement;
  
      if (!chatWelcome || !chat || !chatMessages) return;
  
      chatWelcome.style.display = "none";
      chat.style.display = "block";
  
      if (this.chatHistory.length > 0) {
        this.displayChatHistory();
      } else {
        const aiMessageDiv = document.createElement("div");
        aiMessageDiv.className = "lh-chat-message lh-ai-message";
        aiMessageDiv.innerHTML = `<div class="lh-message-content">Hello! I'm here to help you with this problem. What would you like to know?</div>`;
        chatMessages.appendChild(aiMessageDiv);
      }
  
      const chatInput = this.container.querySelector(
        ".lh-chat-text"
      ) as HTMLInputElement;
      if (chatInput) {
        chatInput.focus();
      }
    }
  
    private displayChatHistory(): void {
      const chatMessages = this.container.querySelector(
        ".lh-chat-messages"
      ) as HTMLElement;
  
      if (!chatMessages || this.chatHistory.length === 0) return;
  
      chatMessages.innerHTML = "";
  
      this.chatHistory.forEach((msg) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `lh-chat-message lh-${msg.role === "user" ? "user" : "ai"}-message`;
        messageDiv.innerHTML = `<div class="lh-message-content">${msg.role === "user" ? msg.content : marked.parse(msg.content)}</div>`;
        chatMessages.appendChild(messageDiv);
      });
  
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  
    private clearChatHistory(): void {
      this.chatHistory = [];
      const chatMessages = this.container.querySelector(
        ".lh-chat-messages"
      ) as HTMLElement;
      if (chatMessages) {
        chatMessages.innerHTML = "";
      }
    }
  
    private async sendChatMessage(): Promise<void> {
      const chatInput = this.container.querySelector(
        ".lh-chat-text"
      ) as HTMLInputElement;
      const chatMessages = this.container.querySelector(
        ".lh-chat-messages"
      ) as HTMLElement;
  
      if (!chatInput || !chatMessages) return;
  
      const message = chatInput.value.trim();
      if (!message) return;
  
      this.chatHistory.push({
        role: "user",
        content: message,
        timestamp: Date.now(),
      });
  
      const userMessageDiv = document.createElement("div");
      userMessageDiv.className = "lh-chat-message lh-user-message";
      userMessageDiv.innerHTML = `<div class="lh-message-content">${message}</div>`;
      chatMessages.appendChild(userMessageDiv);
  
      chatInput.value = "";
  
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "lh-chat-message lh-ai-message lh-loading";
      loadingDiv.innerHTML = `<div class="lh-message-content">Thinking...</div>`;
      chatMessages.appendChild(loadingDiv);
  
      chatMessages.scrollTop = chatMessages.scrollHeight;
  
      try {
        const apiKey = this.getApiKeyForModel(this.selectedModel);
        if (!apiKey) {
          this.showModelKeyError(this.selectedModel);
          return;
        }
  
        const problemContext = `Problem: ${this.currentProblem?.title || "Unknown"}\nDescription: ${this.currentProblem?.description || "No description available"}`;
  
        const currentLanguage = this.getCurrentLanguage();
  
        const domElements = this.collectDOMElements();
  
        const conversationHistory = this.chatHistory
          .slice(-10)
          .map(
            (msg) =>
              `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
          )
          .join("\n");
  
        const response = await fetch(`${this.preferences.serverUrl}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: message,
            problem_context: problemContext,
            current_language: currentLanguage,
            dom_elements: domElements,
            conversation_history: conversationHistory,
            timestamp: new Date().toISOString(),
            model: this.selectedModel,
            user_api_key: this.getApiKeyForModel(this.selectedModel),
          }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
  
        chatMessages.removeChild(loadingDiv);
  
        this.chatHistory.push({
          role: "assistant",
          content: data.message,
          timestamp: Date.now(),
        });
  
        const aiMessageDiv = document.createElement("div");
        aiMessageDiv.className = "lh-chat-message lh-ai-message";
        aiMessageDiv.innerHTML = `<div class="lh-message-content">${marked.parse(data.message)}</div>`;
        chatMessages.appendChild(aiMessageDiv);
  
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } catch (error) {
        chatMessages.removeChild(loadingDiv);
  
        const errorDiv = document.createElement("div");
        errorDiv.className = "lh-chat-message lh-error-message";
        const messageDiv = document.createElement("div");
        messageDiv.className = "lh-message-content";
        messageDiv.textContent =
          "Sorry, I couldn't process your message. Please try again.";
        errorDiv.appendChild(messageDiv);
        chatMessages.appendChild(errorDiv);
  
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  
        private getCurrentLanguage(): string {
      try {
        const allPossibleSelectors = [
          'button[aria-haspopup="dialog"][aria-expanded]',
          '[data-e2e-locator="language-selector"]',
          ".language-selector",
          '[class*="language-selector"]',
          'button[data-state="open"]',
          'button[aria-expanded="true"]',
          ".ant-select-selection-item",
          '[class*="ant-select"]',
          "button[aria-haspopup]",
          '[role="combobox"]',
          "[aria-expanded]",
                ];

        const selectors = [
          'button[aria-haspopup="dialog"][aria-expanded]',
          "button[aria-haspopup]",
          "button[aria-expanded]",
          '[data-e2e-locator="language-selector"]',
          'button[data-state="open"]',
          'button[aria-expanded="true"]',
        ];
  
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            const language = element.textContent?.toLowerCase().trim();
            if (language && this.isValidLanguage(language)) {
              return this.mapLanguageToValue(language);
            }
          }
        }
  
        const allButtons = document.querySelectorAll("button");
        for (const button of allButtons) {
          const text = button.textContent?.toLowerCase().trim();
          if (text && this.isValidLanguage(text)) {
            return this.mapLanguageToValue(text);
          }
        }
  
        const languageSelector = document.querySelector(
          '[data-e2e-locator="language-selector"]'
        );
        if (languageSelector) {
          const selectedOption = languageSelector.querySelector(
            ".ant-select-selection-item"
          );
          if (selectedOption) {
            const language = selectedOption.textContent?.toLowerCase().trim();
            if (language) {
              return this.mapLanguageToValue(language);
            }
          }
        }
  
        const monacoEditor = document.querySelector(".monaco-editor");
        if (monacoEditor) {
          const languageElement = monacoEditor.querySelector("[data-mode]");
          if (languageElement) {
            const mode = languageElement.getAttribute("data-mode");
            if (mode) {
              return this.mapLanguageToValue(mode);
            }
          }
  
          const monacoInstance = (window as any).monaco;
          if (monacoInstance && monacoInstance.editor) {
            const models = monacoInstance.editor.getModels();
            if (models && models.length > 0) {
              const language = models[0].getLanguageId();
              if (language) {
                return this.mapLanguageToValue(language);
              }
            }
          }
  
          const editorElement = monacoEditor.querySelector("[data-lang]");
          if (editorElement) {
            const lang = editorElement.getAttribute("data-lang");
            if (lang) {
              return this.mapLanguageToValue(lang);
            }
          }
  
          const dataUri = monacoEditor.getAttribute("data-uri");
          if (dataUri) {
            const match = dataUri.match(/\.(\w+)$/);
            if (match) {
              const lang = match[1];
              return this.mapLanguageToValue(lang);
            }
          }
        }
  
        const languageIndicators = [
          '[data-e2e-locator="language-selector"]',
          ".ant-select-selection-item",
          'button[aria-haspopup="dialog"]',
          '[role="combobox"]',
        ];
  
        for (const selector of languageIndicators) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const language = element.textContent?.toLowerCase().trim();
            if (language && this.isValidLanguage(language)) {
              return this.mapLanguageToValue(language);
            }
          }
        }
  
        const additionalSelectors = [
          'button[aria-haspopup="dialog"]',
          "button[aria-expanded]",
          "button[data-state]",
          '[data-e2e-locator="language-selector"] .ant-select-selection-item',
          ".language-selector .ant-select-selection-item",
          '[class*="language-selector"] .ant-select-selection-item',
          '[class*="lang-selector"] .ant-select-selection-item',
          '[data-e2e-locator="language-selector"] span',
          ".ant-select-selection-item span",
          '[class*="language"] span',
          '[class*="lang"] span',
          '[data-e2e-locator="language-selector"]',
          ".ant-select-selection-item",
          '[class*="language"]',
          '[class*="lang"]',
          '[data-e2e-locator="language-selector"]',
          ".ant-select-selection-item",
          '[class*="language"]',
          '[class*="lang"]',
        ];
  
        for (const selector of additionalSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const language = element.textContent?.toLowerCase().trim();
            if (language) {
              return this.mapLanguageToValue(language);
            }
          }
        }
  
        const cppElements = document.querySelectorAll("*");
        let cppFound = false;
        for (const element of cppElements) {
          const text = element.textContent?.trim();
          if (text && (text.includes("C++") || text.includes("cpp"))) {
            cppFound = true;
            if (["BUTTON", "SPAN", "DIV", "A"].includes(element.tagName)) {
              return "cpp";
            }
          }
        }
  
        const targetLanguages = [
          "C++",
          "Java",
          "Python",
          "Python3",
          "C",
          "C#",
          "JavaScript",
          "TypeScript",
          "PHP",
          "Swift",
          "Kotlin",
          "Dart",
          "Go",
          "Ruby",
          "Scala",
          "Rust",
          "Racket",
          "Erlang",
          "Elixir",
        ];
  
        const allElements = document.querySelectorAll("*");
        const foundLanguages: {
          language: string;
          element: Element;
          text: string;
        }[] = [];
  
        for (const element of allElements) {
          const text = element.textContent?.trim();
          if (text && text.length > 0 && text.length < 50) {
            if (
              text.includes("3¹") ||
              text.includes("4  2") ||
              text.includes("--------") ||
              text.includes("8  0  7")
            ) {
              continue;
            }
  
            for (const lang of targetLanguages) {
              if (text.toLowerCase() === lang.toLowerCase()) {
                foundLanguages.push({ language: lang, element, text });
              } else if (
                text.toLowerCase().includes(lang.toLowerCase()) &&
                (text.length <= lang.length + 5 ||
                  element.tagName.toLowerCase() === "button" ||
                  element.classList.contains("ant-select-selection-item"))
              ) {
                foundLanguages.push({ language: lang, element, text });
              }
            }
          }
        }
  
        const exactMatches = foundLanguages.filter(
          (item) => item.text.toLowerCase() === item.language.toLowerCase()
        );
  
        const buttonMatches = foundLanguages.filter(
          (item) => item.element.tagName.toLowerCase() === "button"
        );
  
        const selectorMatches = foundLanguages.filter(
          (item) =>
            item.element.classList.contains("ant-select-selection-item") ||
            item.element.closest('[data-e2e-locator="language-selector"]')
        );
  
        if (selectorMatches.length > 0) {
          const bestMatch = selectorMatches[0];
          return this.mapLanguageToValue(bestMatch.language);
        }
  
        if (exactMatches.length > 0) {
          const bestMatch = exactMatches[0];
          return this.mapLanguageToValue(bestMatch.language);
        }
  
        if (buttonMatches.length > 0) {
          const bestMatch = buttonMatches[0];
          return this.mapLanguageToValue(bestMatch.language);
        }
  
        if (foundLanguages.length > 0) {
          const bestMatch = foundLanguages[0];
          return this.mapLanguageToValue(bestMatch.language);
        }
  
        const monacoInstance = (window as any).monaco;
        if (monacoInstance) {
          if (monacoInstance.editor) {
            const models = monacoInstance.editor.getModels();
            if (models && models.length > 0) {
              const model = models[0];
              const languageId = model.getLanguageId();
              if (languageId) {
                return this.mapLanguageToValue(languageId);
              }
            }
          }
        }
        return "python";
      } catch (error) {
        return "python";
      }
    }
  
    private mapLanguageToValue(language: string): string {
      const languageMap: { [key: string]: string } = {
        python: "python",
        python3: "python3",
  
        javascript: "javascript",
        js: "javascript",
  
        typescript: "typescript",
        ts: "typescript",
  
        java: "java",
  
        "c++": "cpp",
        "c++17": "cpp",
        "c++20": "cpp",
        cpp: "cpp",
  
        c: "c",
  
        "c#": "csharp",
        csharp: "csharp",
  
        php: "php",
  
        swift: "swift",
  
        kotlin: "kotlin",
  
        dart: "dart",
  
        go: "go",
  
        ruby: "ruby",
  
        scala: "scala",
  
        rust: "rust",
  
        racket: "racket",
  
        erlang: "erlang",
  
        elixir: "elixir",
      };
  
      const mappedLanguage = languageMap[language.toLowerCase()] || "python";
  
      return mappedLanguage;
    }
  
    private onLanguageChange(language: string): void {
      this.selectedLanguage = language;
  
      if (this.solveComponent) {
        this.solveComponent.setSelectedLanguage(language);
      }
  
      const languageDropdown = this.container.querySelector(
        "#lh-solution-language"
      ) as HTMLSelectElement;
      const languageDropdownContent = this.container.querySelector(
        "#lh-solution-language-content"
      ) as HTMLSelectElement;
  
      if (languageDropdown && languageDropdown.value !== language) {
        languageDropdown.value = language;
      }
      if (languageDropdownContent && languageDropdownContent.value !== language) {
        languageDropdownContent.value = language;
      }
  
      const solutionContent = this.container.querySelector(
        ".lh-solution-content"
      ) as HTMLElement;
  
      if (solutionContent && solutionContent.style.display !== "none") {
        this.solveComponent.generateSolutionInLanguage(language);
      }
    }
  
    private setupLanguageDetection(): void {
      this.languageDetectionInterval = setInterval(() => {
        if (this.userManuallyChangedLanguage) {
          return;
        }
  
        const currentLanguage = this.getCurrentLanguage();
        const languageDropdown = this.container.querySelector(
          "#lh-solution-language"
        ) as HTMLSelectElement;
        const languageDropdownContent = this.container.querySelector(
          "#lh-solution-language-content"
        ) as HTMLSelectElement;
  
        if (languageDropdown && languageDropdown.value !== currentLanguage) {
          languageDropdown.value = currentLanguage;
        }
        if (
          languageDropdownContent &&
          languageDropdownContent.value !== currentLanguage
        ) {
          languageDropdownContent.value = currentLanguage;
        }
      }, 2000);
    }
  
    private updateLanguageDropdowns(): void {
      this.userManuallyChangedLanguage = false;
  
      let currentLanguage = this.getCurrentLanguage();
  
      if (!currentLanguage || currentLanguage === "") {
        currentLanguage = "python";
      }
  
      const languageDropdown = this.container.querySelector(
        "#lh-solution-language"
      ) as HTMLSelectElement;
      const languageDropdownContent = this.container.querySelector(
        "#lh-solution-language-content"
      ) as HTMLSelectElement;
  
      if (languageDropdown) {
        languageDropdown.value = currentLanguage;
      }
  
      if (languageDropdownContent) {
        languageDropdownContent.value = currentLanguage;
      }
    }
  
    private onModelChange(model: string): void {
      const apiKey = this.getApiKeyForModel(model);
  
      if (!apiKey) {
        this.showModelKeyError(model);
        const modelDropdown = this.container.querySelector(
          "#lh-ai-model"
        ) as HTMLSelectElement;
        if (modelDropdown) {
          modelDropdown.value = this.selectedModel;
        }
        return;
      }
  
      this.selectedModel = model;
  
      if (this.solveComponent) {
        this.solveComponent.setSelectedModel(model);
      }
  
      this.showLoading();
  
      this.regenerateContentWithModel(model);
    }
  
    private async regenerateContentWithModel(model: string): Promise<void> {
      if (!this.currentProblem) {
        this.hideLoading();
        return;
      }
  
      const apiKey = this.getApiKeyForModel(model);
      if (!apiKey) {
        this.hideLoading();
        this.showModelKeyError(model);
        return;
      }
  
      try {
        const response = await fetch(`${this.preferences.serverUrl}/hints`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...this.currentProblem,
            model: model,
            user_api_key: this.getApiKeyForModel(model),
          }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
  
        this.updateContent(data, this.currentProblem);
      } catch (error) {
      } finally {
        this.hideLoading();
      }
    }
  
    private getApiKeyForModel(model: string): string | null {
      if (!this.preferences) {
        return null;
      }
  
      switch (model) {
        case "openai":
          return this.preferences.openaiApiKey || null;
        case "anthropic":
          return this.preferences.anthropicApiKey || null;
        case "gemini":
          return this.preferences.geminiApiKey || null;
        default:
          return this.preferences.openaiApiKey || null;
      }
    }
  
    private isValidLanguage(text: string): boolean {
      const validLanguages = [
        "python",
        "python3",
        "javascript",
        "typescript",
        "java",
        "cpp",
        "c",
        "csharp",
        "php",
        "swift",
        "kotlin",
        "dart",
        "go",
        "ruby",
        "scala",
        "rust",
        "racket",
        "erlang",
        "elixir",
        "c++",
        "c#",
        "js",
        "ts",
      ];
  
      const cleanText = text.toLowerCase().trim();
      return validLanguages.includes(cleanText);
    }
  
    private showModelKeyError(model: string): void {
      const errorDiv = document.createElement("div");
      errorDiv.className = "lh-model-error";
      errorDiv.style.cssText = `
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
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;
  
      const modelName = model.charAt(0).toUpperCase() + model.slice(1);
      errorDiv.innerHTML = `
        <strong>TUTORAI</strong><br>
        No API key found for ${modelName}. Please add your ${modelName} API key in the extension options.
      `;
  
            document.body.appendChild(errorDiv);

      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 5000);
    }
  
    private getMonacoEditorContent(): string {
      try {
        const monacoEditor = document.querySelector(".monaco-editor");
                if (!monacoEditor) return "";

        let content = "";

        const textarea = monacoEditor.querySelector("textarea");
        if (textarea && textarea.value) {
          content = textarea.value;
                }

        if (!content) {
          const viewLines = monacoEditor.querySelectorAll(".view-line");
          if (viewLines.length > 0) {
            content = Array.from(viewLines)
              .map((line) => line.textContent?.trim() || "")
              .filter((line) => line.length > 0)
              .join("\n");
          }
                }

        if (!content) {
          const textModel = (window as any).monaco?.editor?.getModels?.()?.[0];
          if (textModel) {
            content = textModel.getValue();
          }
                }

        if (!content) {
          content = monacoEditor.textContent?.trim() || "";
        }
  
        return content;
      } catch (error) {
        return "";
      }
    }
  
    private collectDOMElements(): any {
      try {
        const titleElement =
          document.querySelector('[data-e2e-locator="problem-title"]') ||
          document.querySelector("h1") ||
          document.querySelector(".mr-2");
                const title = titleElement?.textContent?.trim() || "";

        const descriptionElement =
          document.querySelector('[data-track-load="description_content"]') ||
          document.querySelector(".description__24sA") ||
          document.querySelector('[class*="description"]');
                const description = descriptionElement?.textContent?.trim() || "";

        const examplesElement =
          document.querySelector(".example__2hs5") ||
          document.querySelector('[class*="example"]');
                const examples = examplesElement?.textContent?.trim() || "";

        const constraintsElement =
          document.querySelector(".constraint__2Z4X") ||
          document.querySelector('[class*="constraint"]');
                const constraints = constraintsElement?.textContent?.trim() || "";

        let codeEditor = this.getMonacoEditorContent();
  
        if (codeEditor) {
          const monacoEditor = document.querySelector(".monaco-editor");
                      if (monacoEditor) {
              const languageElement = document.querySelector("[data-mode]");
                          const language =
                languageElement?.getAttribute("data-mode") ||
                document.querySelector(".language-selector")?.textContent?.trim() ||
                "javascript";

              const lineCount = monacoEditor.querySelectorAll(".view-line").length;
            const cursorElement = monacoEditor.querySelector(".cursor");
            const cursorPosition = cursorElement
              ? `${cursorElement.getAttribute("data-line") || "1"}:${cursorElement.getAttribute("data-column") || "1"}`
              : "1:1";
  
            codeEditor = `Language: ${language}\nLine Count: ${lineCount}\nCursor: ${cursorPosition}\n\nCode:\n${codeEditor}`;
          }
        } else {
          const codeEditorElement =
            document.querySelector(".CodeMirror") ||
            document.querySelector('textarea[data-cy="code-editor"]');
                    codeEditor = codeEditorElement?.textContent?.trim() || "";
        }

        const testCasesElement =
          document.querySelector(".testcase__2Z5j") ||
          document.querySelector('[class*="testcase"]');
        const testCases = testCasesElement?.textContent?.trim() || "";
  
        return {
          title,
          description,
          examples,
          constraints,
          codeEditor,
          testCases,
        };
      } catch (error) {
        return {};
      }
    }
  
    public showLoading(): void {
      if (this.isLoading) return;
  
      this.isLoading = true;
      const content = this.container.querySelector(".lh-content") as HTMLElement;
      if (content) {
                content.classList.add("loading");

        const loadingOverlay = document.createElement("div");
        loadingOverlay.className = "lh-loading-overlay";
        loadingOverlay.innerHTML = `
          <div class="lh-spinner"></div>
          <div class="lh-loading-text">TUTORAI is analyzing...</div>
        `;
  
        content.appendChild(loadingOverlay);
      }
    }
  
    public hideLoading(): void {
      if (!this.isLoading) return;
  
      this.isLoading = false;
      const content = this.container.querySelector(".lh-content") as HTMLElement;
      if (content) {
                content.classList.remove("loading");

        const loadingOverlay = content.querySelector(".lh-loading-overlay");
        if (loadingOverlay) {
          loadingOverlay.remove();
        }
      }
    }
  
    private async savePreferences(
      preferences: Partial<UserPreferences>
    ): Promise<void> {
      this.preferences = { ...this.preferences, ...preferences };
      await savePreferences(preferences);
    }
  }
  