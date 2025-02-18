import { Problem, Complexity, ChatMessage, ChatResponse } from "../types";

export interface AIConfig {
  selectedModel: string;
  getApiKeyForModel: (model: string) => string | null;
}

export class AIClient {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  private async makeOpenAIRequest(
    messages: any[],
    maxTokens: number = 200
  ): Promise<string> {
    const apiKey = this.config.getApiKeyForModel("openai");
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async makeAnthropicRequest(
    prompt: string,
    maxTokens: number = 200
  ): Promise<string> {
    const apiKey = this.config.getApiKeyForModel("anthropic");
    if (!apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async makeGeminiRequest(
    prompt: string,
    maxTokens: number = 200
  ): Promise<string> {
    const apiKey = this.config.getApiKeyForModel("gemini");
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async makeAIRequest(
    prompt: string,
    maxTokens: number = 200
  ): Promise<string> {
    const model = this.config.selectedModel.toLowerCase();

    try {
      if (model.includes("openai") || model.includes("gpt")) {
        return await this.makeOpenAIRequest(
          [
            {
              role: "system",
              content:
                "You are a helpful programming tutor. Your role is to guide students to solutions, not provide complete answers. Give hints, explain concepts, and ask leading questions. Never provide complete code solutions unless specifically asked for a small snippet to demonstrate a concept.",
            },
            { role: "user", content: prompt },
          ],
          maxTokens
        );
      } else if (model.includes("anthropic") || model.includes("claude")) {
        return await this.makeAnthropicRequest(prompt, maxTokens);
      } else if (model.includes("gemini")) {
        return await this.makeGeminiRequest(prompt, maxTokens);
      } else {
        throw new Error(`Unsupported model: ${model}`);
      }
    } catch (error) {
      console.error("AI request failed:", error);
      throw error;
    }
  }

  async generateHints(problem: Problem, tags: string[]): Promise<string[]> {
    try {
      const prompt = `Write 4-5 helpful hints for this coding problem.

Problem: ${problem.title}
Description: ${problem.description}
Tags: ${tags.join(", ")}

Rules:
- Start with a general hint, then get more specific
- Don't give away the complete solution
- Mention useful data structures or algorithms
- Keep each hint short and clear
- Focus on guiding the student's thinking process
- Ask questions that help them discover the approach

Write one hint per line.`;

      const response = await this.makeAIRequest(prompt, 200);
      const hints = response
        .split("\n")
        .map((hint) => hint.trim())
        .filter((hint) => hint.length > 0);
      return hints.slice(0, 5);
    } catch (error) {
      return ["AI hints not available - using fallback hints"];
    }
  }

  async generatePlan(problem: Problem, tags: string[]): Promise<string> {
    try {
      const prompt = `Write a step-by-step plan to solve this coding problem.

Problem: ${problem.title}
Description: ${problem.description}
Tags: ${tags.join(", ")}

Requirements:
- Break the solution into clear numbered steps
- Mention which data structures or algorithms to use
- Focus on the main solution approach and implementation steps
- Use simple, clear language

IMPORTANT: Write in plain text only. No HTML, no markdown, no special formatting.
Use numbered lists (1. 2. 3.) and simple headers.
DO NOT include edge cases - those belong in a separate section.
DO NOT include time or space complexity analysis - that belongs in a separate section.`;

      return await this.makeAIRequest(prompt, 250);
    } catch (error) {
      return "AI plan not available - using fallback plan";
    }
  }

  async generateEdgeCases(problem: Problem): Promise<string[]> {
    try {
      const prompt = `Write 4-5 edge cases for this coding problem.

Problem: ${problem.title}
Description: ${problem.description}

Requirements:
- Write edge cases specific to this problem
- Include boundary conditions (empty input, single element, etc.)
- Include common failure scenarios
- Keep each edge case short and clear

Write one edge case per line.`;

      const response = await this.makeAIRequest(prompt, 200);
      const edgeCases = response
        .split("\n")
        .map((edge) => edge.trim())
        .filter((edge) => edge.length > 0);
      return edgeCases.slice(0, 5);
    } catch (error) {
      return ["AI edge cases not available - using fallback edge cases"];
    }
  }

  async analyzeComplexity(
    problem: Problem,
    tags: string[]
  ): Promise<Complexity> {
    try {
      const prompt = `Analyze the time and space complexity for this coding problem.

Problem: ${problem.title}
Description: ${problem.description}
Tags: ${tags.join(", ")}

Write:
1. Time complexity with brief explanation
2. Space complexity with brief explanation
3. Simple explanation of why these complexities make sense

Format your response as:
Time: [complexity] - [explanation]
Space: [complexity] - [explanation]
Rationale: [simple explanation]`;

      const response = await this.makeAIRequest(prompt, 200);

      const lines = response.split("\n");
      let time = "AI analysis not available";
      let space = "AI analysis not available";
      let rationale = "Complexity analysis not available.";

      for (const line of lines) {
        if (line.startsWith("Time:")) {
          time = line.replace("Time:", "").trim();
        } else if (line.startsWith("Space:")) {
          space = line.replace("Space:", "").trim();
        } else if (line.startsWith("Rationale:")) {
          rationale = line.replace("Rationale:", "").trim();
        }
      }

      return { time, space, rationale };
    } catch (error) {
      return {
        time: "AI analysis not available",
        space: "AI analysis not available",
        rationale:
          "Complexity analysis not available when AI is not configured.",
      };
    }
  }

  async chat(
    messages: ChatMessage[],
    problem?: Problem,
    context?: {
      currentLanguage?: string;
      domElements?: any;
    }
  ): Promise<ChatResponse> {
    try {
      const conversation = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      let prompt =
        "You are a helpful programming tutor. Your role is to guide students to solutions, not provide complete answers. Give hints, explain concepts, and ask leading questions. Never provide complete code solutions unless specifically asked for a small snippet to demonstrate a concept.\n\n";

      if (problem) {
        prompt += `You are helping with this coding problem:\n\nProblem: ${problem.title}\nDescription: ${problem.description}\n\n`;
      }

      if (context?.currentLanguage) {
        prompt += `The user is working in ${context.currentLanguage}.\n\n`;
      }

      prompt += `Remember: Guide, don't solve. Ask questions to help them think through the problem. Continue this conversation:\n\n${conversation.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}`;

      const response = await this.makeAIRequest(prompt, 300);

      return {
        response: response,
        error: null,
      };
    } catch (error) {
      return {
        response: "",
        error: "Failed to get AI response",
      };
    }
  }
}
