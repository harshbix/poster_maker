# 🪧 Poster Maker — By Farols

A fast, AI-powered social media poster generator built with **React + Vite**. Design news posters for Instagram, TikTok, Twitter, and more — directly in the browser at full 1080px resolution.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔎 **AI News Search** | Search any topic and get 4 real news headlines pulled from the web via the Claude API |
| 🤖 **AI Headline Generator** | Generate punchy, viral-style headlines (Bleacher Report / Pubity style) for any topic |
| 🖼 **Image Upload** | Upload a background image, a circular thumbnail (person shot), and your logo/watermark |
| 🎨 **4 Poster Styles** | Dark Blue · Black Red · White Punch · Gold Black — all with custom accent color swatches |
| 📐 **Two Formats** | Square (1080×1080) for feed posts · Story (1080×1920) for Instagram/TikTok stories |
| ⬇ **Export** | Download full-resolution PNG or copy directly to clipboard |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Claude API key from [console.anthropic.com](https://console.anthropic.com/keys)

### Install & Run

```bash
git clone <your-repo-url>
cd poster_maker
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 API Key

Paste your Claude API key into the **API Key** field in the sidebar. It's used for:
- Web search (news results)
- AI headline generation

The key is never stored — it lives in React state only and is cleared on page refresh.

---

## 🛠 Tech Stack

- **React 19** + **Vite 7**
- **HTML Canvas API** — all poster rendering is done natively, no image libraries
- **Claude API** (`claude-opus-4-5` with `web_search` tool for news, `claude-haiku-4-5` for headlines)
- **Vanilla CSS** — no Tailwind or UI frameworks

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Header.jsx          # Top nav bar
│   ├── Sidebar.jsx         # All controls
│   ├── CanvasArea.jsx      # Preview + export
│   └── LoadingOverlay.jsx  # Loading spinner
├── hooks/
│   └── usePosterState.js   # All poster state
├── lib/
│   ├── posterRenderer.js   # Canvas drawing logic
│   └── api.js              # Claude API calls
└── index.css               # Global design system
```

---

## 📸 How to Use

1. Enter your **Claude API key** in the sidebar
2. Search a news topic or type your own **headline**
3. Upload a **background image** (and optionally a person photo + logo)
4. Pick a **style**, **accent color**, and **format**
5. Hit **⚡ Render Poster** → **⬇ Download PNG**

---

*Made by Farols*
