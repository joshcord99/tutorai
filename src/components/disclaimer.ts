
export class DisclaimerModal {
    private modal: HTMLElement | null = null;
  
      public show(): void {
    this.modal = document.createElement("div");
      this.modal.className = "lh-disclaimer-modal";
      this.modal.innerHTML = `
        <div class="lh-disclaimer-content">
          <div class="lh-disclaimer-header">
            <h2>TUTORAI Disclaimer</h2>
            <button class="lh-close-modal">×</button>
          </div>
          <div class="lh-disclaimer-body">
            <h3>Educational Use Only</h3>
            <p>TUTORAI is designed exclusively for educational purposes to assist users in learning programming concepts and problem-solving techniques. This tool is not intended to provide complete solutions or enable academic dishonesty.</p>
            
            <h3>No Affiliation</h3>
            <p>TUTORAI is not affiliated with, endorsed by, or connected to LeetCode, its parent company, or any other coding platform. This is an independent educational tool.</p>
            
            <h3>Privacy & Data</h3>
            <p>• All processing happens locally on your device<br>
            • No problem data is uploaded to remote servers<br>
            • Your code and problem information never leaves your device<br>
            • Optional OpenAI integration requires your explicit API key</p>
            
            <h3>Contest Safety</h3>
            <p>TUTORAI automatically disables during LeetCode contests to ensure fair competition and prevent any potential violations of contest rules.</p>
            
            <h3>Responsible Use</h3>
            <p>Users are responsible for using this tool ethically and in accordance with their educational institution's policies. TUTORAI should be used as a learning aid, not as a substitute for understanding and solving problems independently.</p>
            
            <h3>Limitations</h3>
            <p>• AI-generated hints and solutions may not always be optimal<br>
            • The tool is provided "as is" without warranties<br>
            • Users should verify and understand all provided guidance</p>
            
            <h3>Open Source</h3>
            <p>TUTORAI is open source software. Users can review the code to understand how it works and verify its privacy practices.</p>
          </div>
          <div class="lh-disclaimer-footer">
            <button class="lh-btn lh-close-disclaimer">I Understand</button>
          </div>
        </div>
      `;
  
      document.body.appendChild(this.modal);
      this.setupEventListeners();
    }
  
    public hide(): void {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
        this.modal = null;
      }
    }
  
    private setupEventListeners(): void {
      if (!this.modal) return;
  
      const closeBtn = this.modal.querySelector(".lh-close-modal") as HTMLElement;
      const closeDisclaimerBtn = this.modal.querySelector(
        ".lh-close-disclaimer"
      ) as HTMLElement;
  
      const closeModal = () => {
        this.hide();
      };
  
      closeBtn.addEventListener("click", closeModal);
      closeDisclaimerBtn.addEventListener("click", closeModal);
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          closeModal();
        }
            });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closeModal();
          document.removeEventListener("keydown", handleKeyDown);
        }
      };
      document.addEventListener("keydown", handleKeyDown);
    }
  
    public isVisible(): boolean {
      return this.modal !== null;
    }
  }
  