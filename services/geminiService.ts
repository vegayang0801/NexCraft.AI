import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Helper to ensure Veo API key selection
const ensureApiKey = async (): Promise<void> => {
  // @ts-ignore - window.aistudio is injected by the script in index.html
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
  }
};

// Helper to create AI instance - MUST be done fresh for Veo to pick up the key
const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Text & Strategy Generation ---
export const generateStrategy = async (
  prompt: string,
  contextData: string,
  attachments: { mimeType: string; data: string }[] = []
): Promise<{ text: string; sources?: any[] }> => {
  const ai = createAI();
  
  // Convert attachments to inlineData format
  const parts: any[] = attachments.map(att => ({
    inlineData: {
      mimeType: att.mimeType,
      data: att.data
    }
  }));

  const systemPrompt = `You are a world-class Creative Director and PR Strategist at a top-tier agency. 
  Your goal is to provide cinematic, high-impact, and emotionally resonant copy and strategy.
  You analyze market trends deeply.
  If the user asks for suggestions, provide them in a structured, persuasive format.
  Context: ${contextData}`;

  parts.push({ text: prompt });

  // Use Gemini 3 Pro for complex reasoning and strategy
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction: systemPrompt,
      thinkingConfig: { thinkingBudget: 2048 } // Use thinking for better strategy
    }
  });

  return {
    text: response.text || "No content generated.",
  };
};

// --- Market Research (Grounding) ---
export const conductResearch = async (query: string): Promise<{ text: string; sources: any[] }> => {
  const ai = createAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Upgraded to Pro for better search synthesis
    contents: `Find the latest high-performing campaigns, trends, or competitors related to: ${query}. Summarize the key visual and textual elements that made them successful.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.flatMap(
    (c: any) => c.web ? [{ uri: c.web.uri, title: c.web.title }] : []
  ) || [];

  return {
    text: response.text || "No research found.",
    sources
  };
};

// --- Image Generation ---
export const generateProfessionalImage = async (
  prompt: string, 
  refImage?: string // base64
): Promise<string | null> => {
  const ai = createAI();
  
  const parts: any[] = [];
  if (refImage) {
    parts.push({
      inlineData: {
        mimeType: 'image/png', // Assuming png for base64, or detect dynamic
        data: refImage
      }
    });
    parts.push({ text: "Use the attached image as a stylistic reference or composition guide. "});
  }

  parts.push({ text: `Create a high-end, award-winning photography or cinematic render. Photorealistic, dramatic lighting, 4k. Prompt: ${prompt}` });

  // Use the specialized image model
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "16:9", // Cinematic
        imageSize: "2K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// --- Video Generation (Veo) ---
export const generateCinematicVideo = async (prompt: string): Promise<string | null> => {
  // 1. Ensure Key
  await ensureApiKey();
  
  // 2. Create Instance with (potentially new) key
  const ai = createAI();

  // 3. Start Operation
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic shot, movie quality, high production value. ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    // 4. Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    // 5. Get URI and fetch bytes
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) return null;

    const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await videoRes.blob();
    return URL.createObjectURL(blob);

  } catch (e) {
    console.error("Video generation failed", e);
    // If key invalid, might need to re-prompt, but simple error return for now
    return null;
  }
};