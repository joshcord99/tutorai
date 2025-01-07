import { Problem } from "../types";
import { safeGetElement, sanitizeText } from "./utils";

export async function readProblem(): Promise<Problem | null> {
  if (!isProblemPage()) {
    return null;
  }

  const title = extractTitle();
  const description = extractDescription();
  const examples = extractExamples();
  const constraints = extractConstraints();

  if (!title || !description) {
    return null;
  }

  return {
    title,
    description,
    examples: examples || undefined,
    constraints: constraints || undefined,
    url: window.location.href,
  };
}

function extractTitle(): string | null {
  const selectors = [
    "h1",
    '[data-e2e-locator="problem-title"]',
    ".mr-2.text-label-1",
    ".text-title-large",
  ];

  for (const selector of selectors) {
    const element = safeGetElement(selector);
    if (element) {
      const text = sanitizeText(element.textContent || "");
      if (text) return text;
    }
  }

  return null;
}

function extractDescription(): string | null {
  const selectors = [
    '[data-track-load="description_content"]',
    ".description__24sA",
    ".content__u3I1",
    '[data-cy="question-title"] + div',
    ".question-content__JfgR",
  ];

  for (const selector of selectors) {
    const element = safeGetElement(selector);
    if (element) {
      const text = sanitizeText(element.innerText || element.textContent || "");
      if (text && text.length > 50) return text;
    }
  }

  return null;
}

function extractExamples(): string | null {
  const examples: string[] = [];

  const exampleSelectors = [
    'h3:contains("Example")',
    'h4:contains("Example")',
    ".example-block",
    '[data-cy="example"]',
  ];

  for (const selector of exampleSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        const text = sanitizeText(element.textContent || "");
        if (text) examples.push(text);
      });
    } catch (error) {}
  }

  if (examples.length === 0) {
    const headings = document.querySelectorAll("h3, h4");
    for (const heading of headings) {
      const text = heading.textContent || "";
      if (text.toLowerCase().includes("example")) {
        let nextElement = heading.nextElementSibling;
        while (nextElement && !nextElement.matches("h3, h4")) {
          const content = sanitizeText(nextElement.textContent || "");
          if (content) examples.push(content);
          nextElement = nextElement.nextElementSibling;
        }
      }
    }
  }

  return examples.length > 0 ? examples.join("\n\n") : null;
}

function extractConstraints(): string | null {
  const constraints: string[] = [];

  const constraintSelectors = [
    'h3:contains("Constraints")',
    'h4:contains("Constraints")',
    ".constraints-block",
    '[data-cy="constraints"]',
  ];

  for (const selector of constraintSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        const text = sanitizeText(element.textContent || "");
        if (text) constraints.push(text);
      });
    } catch (error) {}
  }

  if (constraints.length === 0) {
    const headings = document.querySelectorAll("h3, h4");
    for (const heading of headings) {
      const text = heading.textContent || "";
      if (text.toLowerCase().includes("constraint")) {
        let nextElement = heading.nextElementSibling;
        while (nextElement && !nextElement.matches("h3, h4")) {
          const content = sanitizeText(nextElement.textContent || "");
          if (content) constraints.push(content);
          nextElement = nextElement.nextElementSibling;
        }
      }
    }
  }

  return constraints.length > 0 ? constraints.join("\n\n") : null;
}

function isProblemPage(): boolean {
  return (
    window.location.href.includes("/problems/") &&
    !window.location.href.includes("/contest/")
  );
}
