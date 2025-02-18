import { marked } from "marked";
import { AIClient, AIConfig } from "../tools/ai-client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatConfig {
  selectedModel: string;
  getApiKeyForModel: (model: string) => string | null;
  showModelKeyError: (model: string) => void;
  currentProblem: any;
  getCurrentLanguage: () => string;
  collectDOMElements: () => any;
}

export class ChatComponent {
  private container: HTMLElement;
  private chatHistory: ChatMessage[] = [];
  private config: ChatConfig;
  private isVisible = false;

  constructor(container: HTMLElement, config: ChatConfig) {
    this.container = container;
    this.config = config;
    this.setupChatUI();
  }

  private setupChatUI(): void {
    if (!this.container.classList.contains("lh-chat-container")) {
      this.container.classList.add("lh-chat-container");
    }

    this.container.innerHTML = `
      <div class="lh-chat-welcome">
        <button class="lh-btn lh-need-help-btn">Chat</button>
      </div>
      <div class="lh-chat-messages" style="display: none;"></div>
      <div class="lh-chat-input" style="display: none;">
        <input type="text" class="lh-chat-text" placeholder="Ask for hints or guidance..." />
        <button class="lh-btn lh-send-btn" disabled>Send</button>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const needHelpBtn = this.container.querySelector(
      ".lh-need-help-btn"
    ) as HTMLElement | null;
    const chatInput = this.container.querySelector(
      ".lh-chat-text"
    ) as HTMLInputElement | null;
    const sendBtn = this.container.querySelector(
      ".lh-send-btn"
    ) as HTMLButtonElement | null;

    if (needHelpBtn) {
      needHelpBtn.addEventListener("click", () => this.startChat());
    }

    if (chatInput && sendBtn) {
      const syncDisabled = () => {
        sendBtn.disabled = chatInput.value.trim().length === 0;
      };
      chatInput.addEventListener("input", syncDisabled);
      syncDisabled();

      sendBtn.addEventListener("click", () => this.sendMessage());

      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!sendBtn.disabled) this.sendMessage();
        }
      });
    }
  }

  public startChat(): void {
    const chatWelcome = this.container.querySelector(
      ".lh-chat-welcome"
    ) as HTMLElement | null;
    const chatMessages = this.container.querySelector(
      ".lh-chat-messages"
    ) as HTMLElement | null;
    const chatInput = this.container.querySelector(
      ".lh-chat-input"
    ) as HTMLElement | null;

    if (!chatWelcome || !chatMessages || !chatInput) return;

    this.isVisible = true;
    chatWelcome.style.display = "none";
    chatMessages.style.display = "block";
    chatInput.style.display = "flex";

    if (this.chatHistory.length > 0) {
      this.displayChatHistory();
    } else {
      const aiMessageDiv = document.createElement("div");
      aiMessageDiv.className = "lh-chat-message lh-ai-message";
      aiMessageDiv.innerHTML = `<div class="lh-message-content">Hello! I'm here to help you with this problem. What would you like to know?</div>`;
      chatMessages.appendChild(aiMessageDiv);
    }

    const chatInputField = this.container.querySelector(
      ".lh-chat-text"
    ) as HTMLInputElement | null;
    chatInputField?.focus();
  }

  public hideChat(): void {
    const chatWelcome = this.container.querySelector(
      ".lh-chat-welcome"
    ) as HTMLElement | null;
    const chatMessages = this.container.querySelector(
      ".lh-chat-messages"
    ) as HTMLElement | null;
    const chatInput = this.container.querySelector(
      ".lh-chat-input"
    ) as HTMLElement | null;
    if (chatWelcome && chatMessages && chatInput) {
      this.isVisible = false;
      chatWelcome.style.display = "flex";
      chatMessages.style.display = "none";
      chatInput.style.display = "none";
    }
  }

  public isChatVisible(): boolean {
    return this.isVisible;
  }

  private displayChatHistory(): void {
    const chatMessages = this.container.querySelector(
      ".lh-chat-messages"
    ) as HTMLElement | null;
    if (!chatMessages) return;

    chatMessages.innerHTML = "";
    this.chatHistory.forEach((msg) => {
      const div = document.createElement("div");
      div.className = `lh-chat-message ${msg.role === "user" ? "lh-user-message" : "lh-ai-message"}`;
      div.innerHTML = `<div class="lh-message-content">${
        msg.role === "user"
          ? this.escapeHTML(msg.content)
          : marked.parse(msg.content)
      }</div>`;
      chatMessages.appendChild(div);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  public clearChatHistory(): void {
    this.chatHistory = [];
    const chatMessages = this.container.querySelector(
      ".lh-chat-messages"
    ) as HTMLElement | null;
    if (chatMessages) chatMessages.innerHTML = "";
  }

  public getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  private async sendMessage(): Promise<void> {
    const chatInput = this.container.querySelector(
      ".lh-chat-text"
    ) as HTMLInputElement | null;
    const chatMessages = this.container.querySelector(
      ".lh-chat-messages"
    ) as HTMLElement | null;
    const sendBtn = this.container.querySelector(
      ".lh-send-btn"
    ) as HTMLButtonElement | null;
    if (!chatInput || !chatMessages || !sendBtn) return;

    const message = chatInput.value.trim();
    if (!message) return;

    this.chatHistory.push({
      role: "user",
      content: message,
      timestamp: Date.now(),
    });

    const userDiv = document.createElement("div");
    userDiv.className = "lh-chat-message lh-user-message";
    userDiv.innerHTML = `<div class="lh-message-content">${this.escapeHTML(message)}</div>`;
    chatMessages.appendChild(userDiv);

    chatInput.value = "";
    sendBtn.disabled = true;

    const loadingDiv = document.createElement("div");
    loadingDiv.className = "lh-chat-message lh-ai-message lh-loading";
    loadingDiv.innerHTML = `<div class="lh-message-content">Thinking...</div>`;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const apiKey = this.config.getApiKeyForModel(this.config.selectedModel);
      if (!apiKey) {
        this.config.showModelKeyError(this.config.selectedModel);
        chatMessages.removeChild(loadingDiv);
        return;
      }

      const problemContext = `Problem: ${this.config.currentProblem?.title || "Unknown"}\nDescription: ${this.config.currentProblem?.description || "No description available"}`;
      const currentLanguage = this.config.getCurrentLanguage();
      const domElements = this.config.collectDOMElements();

      const conversationHistory = this.chatHistory
        .slice(-10)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");

      const aiConfig: AIConfig = {
        selectedModel: this.config.selectedModel,
        getApiKeyForModel: this.config.getApiKeyForModel,
      };

      const aiClient = new AIClient(aiConfig);

      const chatResponse = await aiClient.chat(this.chatHistory);
      const data = { message: chatResponse.response };

      chatMessages.removeChild(loadingDiv);

      this.chatHistory.push({
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
      });

      const aiDiv = document.createElement("div");
      aiDiv.className = "lh-chat-message lh-ai-message";
      aiDiv.innerHTML = `<div class="lh-message-content">${marked.parse(data.message)}</div>`;
      chatMessages.appendChild(aiDiv);

      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      chatMessages.removeChild(loadingDiv);
      const errorDiv = document.createElement("div");
      errorDiv.className = "lh-chat-message lh-ai-message";
      errorDiv.innerHTML = `<div class="lh-message-content">Sorry, I couldn't process your message. Please try again.</div>`;
      chatMessages.appendChild(errorDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  public updateConfig(newConfig: Partial<ChatConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private escapeHTML(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
