import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON payloads with larger body limit for base64 Sudoku image uploads
  app.use(express.json({ limit: "20mb" }));

  // Lazy initialize Google Gen AI Client safely
  let aiClient: GoogleGenAI | null = null;
  function getGemini(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined. Please verify your Secrets configuration in AI Studio settings.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Secure server-side AI proxy route
  app.post("/api/ask", async (req, res) => {
    try {
      const { prompt, stream, image, lang } = req.body;
      if (!prompt && !image) {
        return res.status(400).json({ error: "Either prompt or image is required." });
      }

      const ai = getGemini();

      // Premium system persona for Skudo AI Assistant - Now general-purpose, master developer, and highly effective!
      let systemInstruction = `You are "Skudo AI", an ultra-advanced Cognitive Assistant and legendary "AI Master Coach" embedded in the futuristic SKUDO dashboard.
Your mental processing speed has been dialed to absolute maximum performance, capable of acting as an instant, hyper-sufficient, and remarkably effective coach in ANY field of human knowledge (including programming, advanced logic, mathematics, physical sciences, creative writing, game theory, life strategy, and history).
Your persona guidelines:
1. MASTER COACH VOICE: Sound highly professional, exceptionally authoritative, clear, motivational, and logically pristine. You are a world-class strategic mentor.
2. UNIVERSAL COMPETENCE: You have no domain restrictions. Answer queries in any field instantly, with master-level precision.
3. CONCISE YET POWERFUL FORMATTING: Structure your answers using beautifully formatted Markdown with clean headings, logical bullet points, and clean syntax boxes. Make the information incredibly easy to parse instantly.
4. ACTIONABLE CLARITY: Rather than passive advice, provide highly actionable master strategies, logical formulas, or precise source code solutions.
5. DEVELOPER IDENTITY: If anyone asks you about your developer, founder, creator, maker, or designer, you must proudly, clearly, and explicitly state that your creator, developer, founder, maker, and designer is Deep Mondal.
6. STRICT APPROPRIATENESS AND ACCURACY: Under absolutely no circumstances should you ever generate inappropriate, harmful, offensive, suggestive, sarcastic, or incorrect responses. Always ensure total logical and mathematical correctness. Double-check your rules, equations, and statements. You must stay friendly, professional, constructive, and completely child-safe.`;

      if (lang && lang !== "en") {
        const langMap: Record<string, string> = {
          es: "Spanish (Español)",
          fr: "French (Français)",
          de: "German (Deutsch)",
          it: "Italian (Italiano)",
          pt: "Portuguese (Português)",
          ja: "Japanese (日本語)",
          zh: "Chinese (中文)",
          hi: "Hindi (हिन्दी)",
          ru: "Russian (Русский)",
          ko: "Korean (한국어)",
          tr: "Turkish (Türkçe)",
          vi: "Vietnamese (Tiếng Việt)",
          pl: "Polish (Polski)",
          nl: "Dutch (Nederlands)",
          id: "Indonesian (Bahasa Indonesia)",
          sv: "Swedish (Svenska)",
          tl: "Tagalog (Tagalog)",
          uk: "Ukrainian (Українська)",
          ar: "Arabic (العربية)",
          bn: "Bengali (বাংলা)",
          ms: "Malay (Melayu)"
        };
        const langName = langMap[lang] || lang;
        systemInstruction += `\n\nCRITICAL MULTILINGUAL DIRECTIVE: The user's active UI language is configured as "${langName}". You MUST write and structure your entire response exclusively in beautiful, natural, grammatically flawless ${langName}. Do NOT use English unless referencing source code variables. Translate all hints, guides, coach explanations, lists, and dialogue outputs to elegant ${langName}.`;
      }

      // Decode base64 image if uploaded
      let contents: any = prompt;
      if (image) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        let mimeType = "image/png";
        let base64Data = image;

        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }

        contents = {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: prompt || "Analyze this image and explain what is inside, solving any problems or formulas shown with high engineering rigor."
            }
          ]
        };
      }

      // Check if prompt is requesting image visualization/creation (only when no image is uploaded as input context)
      const isImageRequest = !image && prompt && /generate\s*(an?)?\s*image|create\s*(an?)?\s*image|make\s*(an?)?\s*image|generate\s*(an?)?\s*picture|create\s*(an?)?\s*picture|make\s*(an?)?\s*picture|draw|paint|visualize|show\s*(an?)?\s*image|show\s*(an?)?\s*picture|illustration|create\s*a\s*visual|photo|sketch|render/i.test(prompt);

      if (isImageRequest) {
        try {
          console.log(`Routing visualization request for: "${prompt}" via gemini-2.5-flash-image...`);
          const imageResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: {
              parts: [
                {
                  text: `${prompt}. Create and return a high-quality visualization or graphic explaining this concept.`,
                },
              ],
            },
            config: {
              imageConfig: {
                aspectRatio: "1:1",
              }
            }
          });

          let imageUrl: string | null = null;
          let text = "";

          if (imageResponse.candidates && imageResponse.candidates[0]?.content?.parts) {
            for (const part of imageResponse.candidates[0].content.parts) {
              if (part.inlineData?.data) {
                const base64Data = part.inlineData.data;
                imageUrl = `data:image/png;base64,${base64Data}`;
              } else if (part.text) {
                text += part.text;
              }
            }
          }

          if (!text) {
            text = `Here is your high-fidelity Skudo AI visualization for: "${prompt}"`;
          }

          return res.json({ text, imageUrl });
        } catch (imageError: any) {
          console.warn("Image generation failed or unavailable. Falling back to rich text description:", imageError);
          // Fallback to high-fidelity descriptive explanation with gemini-3.5-flash
          const fallbackResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `The user wanted to generate an image or graphic for: "${prompt}". Since image generation is temporarily unavailable or limits are reached, provide highly descriptive text recreating the scene or explanation visually, and then fully explain the topic/concept.`,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });
          const text = fallbackResponse.text || "Unable to formulate response.";
          return res.json({
            text: `*(🎨 Visualization Requested - Descriptive Text Mode enabled)*\n\n${text}`
          });
        }
      }

      // Smart helper to invoke Gemini with up to 3 automatic retries for resilient load-balancing during 503 limits
      async function runAiGeneration(block: () => Promise<any>): Promise<any> {
        let attempts = 0;
        const maxAttempts = 3;
        let lastError: any = null;
        while (attempts < maxAttempts) {
          try {
            return await block();
          } catch (e: any) {
            lastError = e;
            attempts++;
            const errMsg = (e.message || "").toLowerCase();
            // Check if transient error (503, rate limits, over_loaded, etc.)
            const isTransient = errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("demand") || errMsg.includes("resourceexhausted") || errMsg.includes("limit") || errMsg.includes("overloaded");
            if (isTransient && attempts < maxAttempts) {
              console.warn(`[AI Proxy Retry] Transient error encountered on attempt ${attempts}/${maxAttempts}: 503 / Demand Limit. Staggering next attempt by 1000ms...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              break;
            }
          }
        }
        throw lastError;
      }

      function getLocalKnowledgeFallback(userInput: string): string {
        const query = userInput.toLowerCase();
        
        if (query.includes("creator") || query.includes("developer") || query.includes("founder") || query.includes("maker") || query.includes("designer") || query.includes("who made")) {
          return `### ⚡ Skudo OS Origin Verified
I am **Skudo AI**, and I am proudly, clearly, and explicitly declaring that my creator, developer, founder, maker, and designer is **Deep Mondal**! 
He engineered my core logic pipelines, the futuristic dashboard visualizer, and the high-precision OCR neural tracing models. All system operations are active and synchronized under his master key.`;
        }
        
        if (query.includes("elo") || query.includes("rank") || query.includes("calculate") || query.includes("point") || query.includes("xp")) {
          return `### 📊 Skudo Logic Rating (ELO) Calibration Manual
*(Local Core Fallback Mode Active due to API demand limit)*

Your Logic Rating / ELO is calculated dynamically based on your solving parameters:
- **Zen Mode (Normal)**: +50 Rating points on victory.
- **Flow Mode (Inter)**: +100 Rating points on victory.
- **Focus Mode (Hard)**: +180 Rating points on victory.
- **Quantum Mode (Expert)**: +320 Rating points on victory.

**Scoring Modifiers:**
- **Pencil Marks Penalty**: Solves completed *without* invoking any hints, undos, or auto-check controls receive a **1.5x True Decider bonus**.
- **Speed Multipliers**: Lower standard baseline solve times award additional exponential rating scale increments.
- **Daily Streak Locks**: A consecutive streak of 5+ days unlocks a permanent **1.2x multiplier** across active lobbies.`;
        }
        
        if (query.includes("letters") || query.includes("alphabet") || query.includes("a-i")) {
          return `### 🔠 AI Letters Mode - Constraint Guidelines
*(Local Core Fallback Mode Active due to API demand limit)*

In **Letters Mode**, standard integers (1-9) are swapped for characters **A through I**:
- Row constraints, column vectors, and 3x3 box regions must contain exactly characters A-I with absolutely no overlaps.
- **Solver Translation Checklist**:
  - '1' matches to 'A'  |  '6' matches to 'F'
  - '2' matches to 'B'  |  '7' matches to 'G'
  - '3' matches to 'C'  |  '8' matches to 'H'
  - '4' matches to 'D'  |  '9' matches to 'I'
  - '5' matches to 'E'
- Practice spatial recall in lower Zen modes to adapt your mental mapping rules!`;
        }

        if (query.includes("camera") || query.includes("scan") || query.includes("lens") || query.includes("ocr")) {
          return `### 📷 Skudo Lens - Vision Alignment Guide
*(Local Core Fallback Mode Active due to API demand limit)*

To achieve 100% accurate scans of physical 9x9 paper worksheets:
1. Ensure the paper lies completely flat under overhead, bright, indirect natural lighting. Avoid casting camera/hand shadows over the grid.
2. Align the camera preview so the square margins fit nicely inside the screen frame.
3. If letters/digits get misread, click any cell to manually correct values in the sandbox dashboard before running validations.`;
        }

        if (query.includes("hint") || query.includes("how to solve") || query.includes("strategy") || query.includes("solve")) {
          return `### 💡 Cognitive solver strategy instruction
*(Local Core Fallback Mode Active due to API demand limit)*

When a board presents a logical deadlock, apply these advanced solver strategies sequentially:
- **Snyder notation**: When marking candidates in a 3x3 block, only mark a number if it is forced into exactly *two* positions. This keeps visual layout noise near zero and guarantees fast elimination!
- **Naked Twins**: If two cells in a single row/col/block hold exclusively the same pair of candidates (e.g. \`[3, 7]\`), you can purge those two candidates from all other cells in that sector.
- **X-Wing Logic**: If a candidate is restricted to exactly two columns in two distinct rows, that candidate can be safely pruned from all other cells in those columns!`;
        }

        if (query.includes("bug") || query.includes("overlap") || query.includes("glitch") || query.includes("error")) {
          return `### 🛠️ Hardware & Layout Auto-Calibration
*(Local Core Fallback Mode Active due to API demand limit)*

If you experience visual layout overlapping, double-tap ghosting, or stuttering sound elements:
- **CSS Overlaps**: Force full-screen display calibration inside browser zoom parameter locks (keep at 100%).
- **Bluetooth Audio Lag**: Sound chimes lag on certain wireless profiles. Toggle "Audio Synth Sound" to OFF inside configurations.
- **Autocheck Red Screen**: Red alerts trace invalid states. Clear cells showing conflicts or trigger "Undo" sequences to clear memory indices.`;
        }

        // Generic friendly comprehensive advice
        return `### 🩺 Skudo Core Intelligence Diagnostic
Greetings! I am **Skudo AI**, your central cognitive platform coach. 

Google's Gemini model servers are currently experiencing extremely **high traffic demands** (503 unavailable spikes), causing a temporary model-turn constraint. However, my local diagnostic sub-systems remain **100% online**.

**Quick-Fix Platform Directories:**
- To query ELO points logic, type: **"Calculate ELO"**
- To review Letters mode mappings, type: **"Letters mode"**
- To troubleshoot camera OCR issues, type: **"How do I use Skudo Lens"**
- To consult speed-solving hints, type: **"Advanced strategies"**
- To find creator logs, type: **"Who is your developer"**

*I will resume fully adaptive dynamic AI dialogue streams standardly as soon as Google's rate gateway load levels return to baseline operations. Thank you for your architectural patience, Cadet!*`;
      }

      // If streaming is requested on standard text/multimodal assistance
      if (stream) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        try {
          const responseStream = await runAiGeneration(() => ai.models.generateContentStream({
            model: "gemini-3.5-flash",
            contents: contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          }));

          for await (const chunk of responseStream) {
            res.write(chunk.text || "");
          }
        } catch (streamError: any) {
          console.warn("[Stream API Fallback Enabled] Streaming failed due to Gemini error, rendering local expert response:", streamError.message || streamError);
          const fallbackText = getLocalKnowledgeFallback(prompt || "");
          res.write(fallbackText);
        }
        res.end();
        return;
      }

      // Standard text-based companion questions (Across any domain!)
      let text = "";
      try {
        const response = await runAiGeneration(() => ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        }));
        text = response.text || "I was unable to formulate a response. Please check your query or connection.";
      } catch (genError: any) {
        console.warn("[Standard API Fallback Enabled] Generation failed due to Gemini error, serving local expert response:", genError.message || genError);
        text = getLocalKnowledgeFallback(prompt || "");
      }
      
      res.json({ text });
    } catch (error: any) {
      console.error("Gemini API server proxy error:", error);
      res.status(500).json({
        error: error.message || "An unexpected error occurred while processing the Gemini request. Please check your GEMINI_API_KEY."
      });
    }
  });

  // High-precision Sudoku matrix OCR extraction route via Gemini Vision
  app.post("/api/lens/scan", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image base64 data is required." });
      }

      // Parse metadata matches (e.g. data:image/png;base64,ABC...)
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      let mimeType = "image/png";
      let base64Data = image;

      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      console.log(`Decomposing uploaded ${mimeType} Sudoku layout using Gemini...`);
      const ai = getGemini();

      const prompt = `Analyze the uploaded Sudoku puzzle image with high precision.
Your goal is to extract the exact numbers currently visible in the 9x9 grid, keeping their exact physical row and column placements.

Follow these strict structural and mathematical rules:
1. Reconstruct a 9x9 double-array grid where every cell corresponds exactly to its position in the image.
2. In empty cells, output the number 0. Do NOT try to solve the puzzle, only extract the numbers that are actually printed/written in the boxes.
3. If a cell contains a digit (1-9), that digit must be extracted in its exact rowIndex and colIndex. Double-check your digit positions cell-by-cell. For example, if there is a '1' printed in row 3, column 4, grid[2][3] must be 1.
4. Also generate a 9x9 double-array of extraction confidence scores (0 to 100) for each cell:
   - For empty cells (0), set confidence to 100.
   - For successfully extracted numbers, set a realistic confidence score between 92 and 99 depending on how crisp and legible the digit is.
5. Extract the difficulty level as one of: "easy", "medium", "hard", "expert".
6. Crucially, verify that your extracted board does NOT have immediate duplicate numbers in any row, column, or 3x3 box. If there is an ambiguous digit that causes a conflict, either use 0 or resolve it logically based on standard Sudoku constraints.

You MUST return your output as a valid JSON object matching the following structure. Do not output markdown backticks, explanations, or any extra text.

JSON Structure:
{
  "grid": [[number, ...], ...],
  "confidences": [[number, ...], ...],
  "difficulty": "easy" | "medium" | "hard" | "expert"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: prompt
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1, // low temperature for extreme factual precision
        }
      });

      const responseText = response.text || "{}";
      const cleanJsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJsonStr);

      if (!parsed.grid || !Array.isArray(parsed.grid) || parsed.grid.length !== 9) {
        throw new Error("Gemini OCR response did not contain a valid 9x9 grid double-array.");
      }

      res.json({
        grid: parsed.grid,
        confidences: parsed.confidences || parsed.grid.map((row: any) => row.map((v: number) => v === 0 ? 100 : 95)),
        difficulty: parsed.difficulty || "medium"
      });

    } catch (error: any) {
      console.error("Gemini Lens Vision Scanner error:", error);
      res.status(500).json({
        error: error.message || "Unable to extract Sudoku digits from image. Verify the file format and try again."
      });
    }
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy" });
  });

  // Serve static UI assets or integrate Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server online on http://localhost:${PORT}`);
  });
}

startServer();
