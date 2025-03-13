export interface DOMElements {
  title: string;
  description: string;
  examples: string;
  constraints: string;
  codeEditor: string;
  language: string;
  lineCount: number;
  cursorPosition: string;
}

export class UIGrabComponent {
  private static instance: UIGrabComponent;

  public static getInstance(): UIGrabComponent {
    if (!UIGrabComponent.instance) {
      UIGrabComponent.instance = new UIGrabComponent();
    }
    return UIGrabComponent.instance;
  }

  public getCurrentLanguage(): string {
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
        '[class*="language"]',
        '[class*="lang"]',
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
        if (text && text.includes("C++")) {
          cppFound = true;
          if (["BUTTON", "SPAN", "DIV", "A"].includes(element.tagName)) {
            return "c++";
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

  public collectDOMElements(): DOMElements {
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

          return {
            title,
            description,
            examples,
            constraints,
            codeEditor,
            language,
            lineCount,
            cursorPosition,
          };
        }
      }

      return {
        title,
        description,
        examples,
        constraints,
        codeEditor,
        language: this.getCurrentLanguage(),
        lineCount: 0,
        cursorPosition: "1:1",
      };
    } catch (error) {
      return {
        title: "",
        description: "",
        examples: "",
        constraints: "",
        codeEditor: "",
        language: "python",
        lineCount: 0,
        cursorPosition: "1:1",
      };
    }
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

  private isValidLanguage(text: string): boolean {
    const validLanguages = [
      "python",
      "python3",
      "javascript",
      "typescript",
      "java",
      "c++",
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

  private mapLanguageToValue(language: string): string {
    const languageMap: { [key: string]: string } = {
      python: "python",
      python3: "python3",
      javascript: "javascript",
      js: "javascript",
      typescript: "typescript",
      ts: "typescript",
      java: "java",
      "c++": "c++",
      "c++17": "c++",
      "c++20": "c++",
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

    const mappedLanguage =
      languageMap[language.toLowerCase()] || "Pick Language";
    return mappedLanguage;
  }
}
