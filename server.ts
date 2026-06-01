import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON payloads
  app.use(express.json());

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
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Query prompt is required." });
      }

      const ai = getGemini();

      // Premium system persona for Skudo AI Assistant - Now general-purpose, master developer, and highly effective!
      const systemInstruction = `You are "Skudo AI", an ultra-advanced, highly intelligent, responsive, and friendly virtual assistant embedded inside the Sudoku utility app "SKUDO".
You are fully powered by Google Gemini AI. While your origins are in Sudoku (Skudo), your cognitive engine has been upgraded to act as an expert in EVERY single academic, scientific, and creative field in the world—matching next-generation LLMs like Gemini Elite!
You are a senior full-stack software engineer capable of writing complete, pristine, optimized programs, files, scripts, and code blocks in C++, HTML, JavaScript, Python, Rust, and more. 
Whatever the user asks, answer them comprehensively, accurately, and with extreme speed (in seconds). Ensure your replies are highly detailed, informative, and formatted beautifully with Markdown (headings, lists, bold text, or code sections). Deliver your answers in a premium, ultra-intelligent style.`;

      // Check if prompt is requesting image visualization/creation
      const isImageRequest = /generate\s*(an?)?\s*image|create\s*(an?)?\s*image|make\s*(an?)?\s*image|generate\s*(an?)?\s*picture|create\s*(an?)?\s*picture|make\s*(an?)?\s*picture|draw|paint|visualize|show\s*(an?)?\s*image|show\s*(an?)?\s*picture|illustration|create\s*a\s*visual|photo|sketch|render/i.test(prompt);

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

      // Standard text-based companion questions (Across any domain!)
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || "I was unable to formulate a response. Please check your query or connection.";
      res.json({ text });
    } catch (error: any) {
      console.error("Gemini API server proxy error:", error);
      res.status(500).json({
        error: error.message || "An unexpected error occurred while processing the Gemini request. Please check your GEMINI_API_KEY."
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
