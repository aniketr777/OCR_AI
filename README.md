# 🖼 OCR + AI Screenshot Tool

An Electron-based desktop application that allows you to **capture a region of your screen**, perform **OCR (Optical Character Recognition)** on it, and process the extracted text using **Groq AI** for insights, summaries, or code formatting.

---

## ✨ Features
- 📷 **Screen Capture** – Select and capture any area of your screen
- 🔍 **OCR** – Extract text from images using [OCR.Space](https://ocr.space/)
- 🤖 **AI Processing** – Process and enhance extracted text with [Groq AI](https://groq.com/)
- 🖱 **System Tray** – Quick access from the system tray menu
- ⌨ **Hotkey Support** – Trigger capture with `Ctrl + Shift + S` (Windows/Linux) or `Cmd + Shift + S` (macOS)
- 💬 **AI Chat** – Send OCR results to AI for further conversation

---

## 📦 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/aniketr777/OCR_AI.git
cd OCR_AI
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Set up environment variables
Create a `.env` file in the project root with the following content:
```
GROQ_API_KEY=your-groq-api-key
OCR_API_KEY=your-ocr-space-api-key
```

⚠ Do not commit your .env file to GitHub. It’s already ignored via .gitignore.

---

## 🚀 Run the App
```bash
npm start
```

---

## 🎯 Usage
- **From Tray Menu:** Click the app’s tray icon → Select "Take Screenshot"
- **Using Shortcut:** Press Ctrl + Shift + S (Windows/Linux) or Cmd + Shift + S (macOS)
- **Result Window:** Shows OCR text and AI-enhanced output

---

## 🛠 Tech Stack
- **Electron** – Cross-platform desktop app framework
- **Node.js** – Backend logic
- **JavaScript (ES6)** – Main code
- **OCR.Space API** – Text recognition from images
- **Groq API** – AI-powered text processing

---

## 📂 Project Structure
```
.
├── main.js           # Electron main process
├── overlay.html      # Region selection UI
├── result.html       # OCR & AI results UI
├── icon.png          # Tray icon
├── package.json      # Dependencies & scripts
├── .env              # API keys (ignored in git)
└── .gitignore        # Prevents sensitive files from uploading
```

---

## 📝 License
This project is licensed under the MIT License – feel free to use and modify.


JavaScript (ES6) – Main code

OCR.Space API – Text recognition from images

Groq API – AI-powered text processing
