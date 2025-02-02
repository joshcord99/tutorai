# TUTORAI

A privacy-preserving coding problem tutor for LeetCode that provides AI-powered hints, solutions, and tutoring.

## Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd server
pip install -r requirements.txt
cd ..
```

### 2. Build the Extension

```bash
npm run build
```

### 3. Start the Server

```bash
cd server
uvicorn app:app --reload --host 127.0.0.1 --port 5050
```

### 4. Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `dist` folder
4. The extension will appear as "TUTORAI"

### 5. Use the Extension

1. Go to any LeetCode problem (e.g., `https://leetcode.com/problems/two-sum/`)
2. Press `Ctrl+Shift+L` or click the extension icon
3. The TUTORAI overlay will appear with AI-powered tutoring features

## Features

- AI-powered hints and solutions
- Complexity analysis
- Edge case identification
- Interactive chat with AI tutor
- Privacy-preserving (runs locally)

## API Documentation

Visit `http://127.0.0.1:5050/docs` to see the FastAPI documentation.

## Environment Variables

Create a `.env` file in the server directory with your OpenAI API key:

```
OPENAI_API_KEY=your_api_key_here
```
