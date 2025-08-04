# Electron OCR + AI Desktop App

This app lets you quickly select a region of your screen, run OCR on the captured image, and get a natural-language answer or code summarization from an advanced LLM (Groq) all in a beautiful chat interface—using just a keyboard shortcut!

---

## Features

- 🚀 **Quick region selection:** Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (Windows/Linux) or <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (Mac) at any time.
- 🖼️ **Instant OCR:** The captured region is sent to OCR.space for high-quality text extraction.
- 🤖 **AI Assistance:** Extracted text is sent to an LLM (Llama-3.1-8b via Groq) and the answer/code solution is displayed in a sleek chat UI.
- 💬 **Continue the conversation:** Ask follow-up questions in chat, referencing the original content.
- 🌗 **Modern, responsive UI:** Beautiful dark/green theme, code blocks, copy-to-clipboard, and touch-friendly interactions.

---

## Requirements

- Node.js v16+ and npm
- Your **OCR.space API key** and **Groq API key**

---

## Quickstart

1. **Clone or download this repo.**

2. **Install dependencies:**
    ```
    npm install
    ```

3. **Add your API keys.**
    - Create a `.env` file in the project root:
        ```
        GROQ_API_KEY=your_groq_api_key_here
        OCR_API_KEY=your_ocr_space_api_key_here
        ```

4. **Run the app:**
    ```
    npm start
    ```

5. **Use the hotkey!**
    - Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> or <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> to select a screen region. Watch the magic happen in the popup!

---

## How It Works

- The app overlays a transparent window for selection.
- Screenshot is taken and region is cropped and saved.
- The cropped image is sent to OCR.space, and extracted text is instantly shown in the UI.
- Meanwhile, the text is sent to Groq, and the LLM answer/code is rendered in a readable chat bubble (code in markdown).
- You can chat further with the LLM right in the popup.

---

## Security Tips

- **Never commit your `.env` file** (it's in `.gitignore`).
- All processing except OCR/LLM happens locally.

---

## Customization

- You can tune the LLM prompts or code rendering in `main.js` and `result.html`.
- The UI uses only HTML/CSS and can be themed or expanded easily.

---

## License

MIT

---

Enjoy!
