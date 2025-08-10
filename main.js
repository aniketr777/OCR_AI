const {
  app,
  BrowserWindow,
  screen,
  globalShortcut,
  ipcMain,
  desktopCapturer,
  Tray,
  Menu,
} = require("electron");
const fs = require("fs");
const path = require("path");
const { ocrSpace } = require("ocr-space-api-wrapper");
const Groq = require("groq-sdk");

// Load environment variables
require("dotenv").config();

// Initialize Groq client with env key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

let overlayWin = null;
let resultWin = null;
let tray = null;

// --- Window Creation Functions ---
function createResultPopup() {
  if (resultWin) {
    resultWin.focus();
    return;
  }
  resultWin = new BrowserWindow({
    width: 700,
    height: 850,
    autoHideMenuBar: true,
    title: "AI & OCR Result",
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });
  resultWin.loadFile("result.html");
  resultWin.on("closed", () => {
    resultWin = null;
  });
}

function createOverlay() {
  if (overlayWin) {
    overlayWin.focus();
    return;
  }
  const { width, height, x, y } = screen.getPrimaryDisplay().bounds;
  overlayWin = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    frame: false,
    fullscreen: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });
  overlayWin.loadFile("overlay.html");
  overlayWin.on("closed", () => {
    overlayWin = null;
  });
}

// --- App Lifecycle ---
app.whenReady().then(() => {
  tray = new Tray(path.join(__dirname, "icon.png"));
  const contextMenu = Menu.buildFromTemplate([
    { label: "Take Screenshot", click: createOverlay },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("OCR & AI Screenshot Tool");
  tray.setContextMenu(contextMenu);

  globalShortcut.register("CommandOrControl+Shift+S", createOverlay);
});

app.on("window-all-closed", () => {
  // Keep running in background
});

app.on("activate", () => {
  if (resultWin) resultWin.focus();
});

// --- IPC Handlers ---
ipcMain.handle("capture-region", async (evt, rect) => {
  if (overlayWin) overlayWin.hide();

  await new Promise((resolve) => setTimeout(resolve, 300));

  const display = screen.getPrimaryDisplay();
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: display.size.width, height: display.size.height },
  });
  const source =
    sources.find((s) => s.display_id == `${display.id}`) || sources[0];
  if (!source) return;

  const img = source.thumbnail;
  const scaleX = img.getSize().width / display.size.width;
  const scaleY = img.getSize().height / display.size.height;
  const cropRect = {
    x: Math.round(rect.x * scaleX),
    y: Math.round(rect.y * scaleY),
    width: Math.round(rect.width * scaleX),
    height: Math.round(rect.height * scaleY),
  };

  if (cropRect.width < 10 || cropRect.height < 10) {
    if (overlayWin) overlayWin.close();
    if (resultWin) resultWin.close();
    return;
  }

  const cropped = img.crop(cropRect);
  const pngBuffer = cropped.toPNG();

  createResultPopup();

  // Save temp screenshot
  const tempDir = app.getPath("temp");
  const savePath = path.join(tempDir, `screenshot_${Date.now()}.png`);
  fs.writeFileSync(savePath, pngBuffer);

  let ocrText = "";
  try {
    const result = await ocrSpace(savePath, {
      apiKey: process.env.OCR_API_KEY,
      language: "eng",
      OCREngine: 2,
      scale: true,
      isOverlayRequired: true,
    });

    const parsedResult = result.ParsedResults && result.ParsedResults[0];
    if (
      parsedResult &&
      parsedResult.Overlay &&
      parsedResult.Overlay.Lines.length > 0
    ) {
      const lines = parsedResult.Overlay.Lines;
      lines.sort((a, b) => a.MinTop - b.MinTop);

      const processedLines = lines.map((line) => {
        line.Words.sort((a, b) => a.Left - b.Left);
        return line.Words.map((word) => word.WordText).join(" ");
      });

      ocrText = processedLines.join("\n");
    } else {
      ocrText = parsedResult?.ParsedText || "(No text detected)";
    }
  } catch (e) {
    ocrText = `OCR Error: ${e.message}`;
  }

  if (resultWin) {
    resultWin.webContents.send("ocr-ready", { ocrText });
  }

  let aiText = "";
  if (ocrText && !ocrText.startsWith("OCR Error:")) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an expert assistant. CRITICAL RULE: Wrap code in triple backticks.",
          },
          { role: "user", content: ocrText },
        ],
        model: "llama-3.1-8b-instant",
      });
      aiText =
        chatCompletion.choices[0]?.message?.content ||
        "(AI did not provide a response)";
    } catch (e) {
      aiText = `AI Error: ${e.message}`;
    }
  }

  if (resultWin) {
    resultWin.webContents.send("ai-ready", { aiText, ocrText });
  }

  // Delete temp file
  try {
    fs.unlinkSync(savePath);
  } catch (e) {
    console.error("Failed to delete screenshot:", e);
  }

  if (overlayWin) overlayWin.close();
});

ipcMain.handle("chat-with-llm", async (event, conversation) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: conversation,
      model: "llama-3.1-8b-instant",
    });
    return (
      chatCompletion.choices[0]?.message?.content ||
      "(AI did not provide a response)"
    );
  } catch (e) {
    return `(LLM Error: ${e.message})`;
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
