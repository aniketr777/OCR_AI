const {
  app,
  BrowserWindow,
  screen,
  globalShortcut,
  ipcMain,
  desktopCapturer,
} = require("electron");
const fs = require("fs");
const path = require("path");
const { ocrSpace } = require("ocr-space-api-wrapper");
const Groq = require("groq-sdk");

require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let overlayWin = null;
let resultWin = null;

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

app.whenReady().then(() => {
  globalShortcut.register("CommandOrControl+Shift+S", createOverlay);
});

ipcMain.handle("capture-region", async (evt, rect) => {
  if (overlayWin) overlayWin.hide();
  createResultPopup();

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
  const savePath = path.join(
    app.getPath("userData"),
    `screenshot_${Date.now()}.png`
  );
  fs.writeFileSync(savePath, pngBuffer);

  let ocrText = "";
  try {
    const result = await ocrSpace(savePath, {
      apiKey: process.env.OCR_API_KEY,
      language: "eng",
    });
    ocrText =
      (result.ParsedResults && result.ParsedResults[0]?.ParsedText) ||
      "(No text detected)";
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
              "You are an expert assistant.and also give short response as per user need . CRITICAL RULE: You MUST wrap any and all code blocks in markdown triple backticks (e.g., ``````) and give best code . Do not write any code outside of these backticks.",
          },
          { role: "user", content: ocrText },
        ],
        model: "llama-3.1-8b-instant",
      });
      aiText =
        chatCompletion.choices[0]?.message?.content ||
        "(AI did not provide a response)";
      console.log("--- RAW AI RESPONSE ---", aiText);
    } catch (e) {
      aiText = `AI Error: ${e.message}`;
    }
  }

  if (resultWin) {
    resultWin.webContents.send("ai-ready", { aiText, ocrText });
  }

  fs.unlinkSync(savePath);
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
