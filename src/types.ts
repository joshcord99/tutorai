export interface Problem {
    title: string;
    description: string;
    examples?: string;
    constraints?: string;
    url: string;
  }
  
  export interface HintResponse {
    problem_meta: {
      title: string;
      url: string;
      tags: string[];
    };
    hints: string[];
    plan: string;
    edge_cases: string[];
    complexity: {
      time: string;
      space: string;
      rationale: string;
    };
    solution?: string;
    disclaimer: string;
  }
  
  export interface UserPreferences {
    panelPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    darkMode: boolean;
    fontSize: "small" | "medium" | "large";
    contestSafeMode: boolean;
    localServerEnabled: boolean;
    serverUrl: string;
    neverUploadToRemote: boolean;
    panelVisible: boolean;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    geminiApiKey?: string;
    claudeApiKey?: string;
  }
  
  export interface PanelPosition {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  