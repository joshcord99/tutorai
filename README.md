# TUTORAI

A standalone privacy-preserving coding problem tutor for LeetCode that provides AI-powered hints, solutions, and tutoring.

## Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

### 2. Build the Extension

```bash
npm run build
```

### 3. Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `dist` folder
4. The extension will appear as "TUTORAI"

### 4. Configure API Keys

1. Click on the extension icon and select "Options"
2. Enter your API keys for the AI services you want to use:
   - OpenAI API Key (for GPT models)
   - Anthropic API Key (for Claude models)
   - Google Gemini API Key (for Gemini models)

### 5. Use the Extension

1. Go to any LeetCode problem (e.g., `https://leetcode.com/problems/two-sum/`)
2. Press `Ctrl+Shift+L` or click the extension icon
3. The TUTORAI overlay will appear with AI-powered tutoring features

## Features

- AI-powered hints and solutions
- Complexity analysis
- Edge case identification
- Interactive chat with AI tutor
- Privacy-preserving (runs entirely in your browser)
- Support for multiple AI providers (OpenAI, Anthropic, Google)

## Privacy

This extension is completely standalone and runs entirely in your browser. Your API keys and problem data never leave your device. All AI requests are made directly from your browser to the AI service providers.
