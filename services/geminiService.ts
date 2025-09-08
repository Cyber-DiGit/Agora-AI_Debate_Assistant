import { GoogleGenAI, Chat, Type } from "@google/genai";
import { DebateSettings, Stance, GroundingSource, Message, Winner } from '../types';
import { API_KEY } from '../env';

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
let chat: Chat | null = null;

const createSystemInstruction = (settings: DebateSettings, aiStance: Stance): string => {
  return `You are an advanced AI named Agora, designed for structured debate.
Your persona for this debate is: ${settings.aiPersona}.
The debate topic is: "${settings.topic}".
The user has chosen the stance: "${settings.userStance}".
You MUST take the opposing stance: "${aiStance}".
You must adhere to a standard debate format.
You can understand and process Hinglish (a mix of Hindi and English) but you must ALWAYS respond in clear, well-structured English.
When you use information from the web, it will be cited.
Begin the debate now with your opening statement. Keep it concise, around 3-4 sentences.`;
};

export const startOrContinueChat = (settings: DebateSettings, aiStance: Stance): Chat => {
  const systemInstruction = createSystemInstruction(settings, aiStance);
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
    },
  });
  return chat;
};

export const sendMessageToAI = async (
  currentChat: Chat,
  message: string
): Promise<{ text: string, sources: GroundingSource[] }> => {
  try {
    const response = await currentChat.sendMessage({ message });
    
    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    let sources: GroundingSource[] = [];
    if (groundingMetadata?.groundingChunks) {
      sources = groundingMetadata.groundingChunks
        .map((chunk: any) => ({
          uri: chunk.web?.uri,
          title: chunk.web?.title,
        }))
        .filter((source): source is GroundingSource => !!source.uri && !!source.title);
    }
    
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return { text, sources: uniqueSources };
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return { text: "I apologize, but I encountered an error and cannot continue the debate at this moment.", sources: [] };
  }
};

export const getDebateWinner = async (messages: Message[]): Promise<{ winner: Winner, judgement: string }> => {
  const transcript = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');

  const prompt = `The following is a transcript of a debate. Please act as an impartial judge and determine the winner based on the quality of arguments, logical consistency, and use of evidence. The participants are "USER" and "AI". Declare "user", "ai", or "draw" as the winner and provide a brief justification for your decision.

Debate Transcript:
${transcript}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winner: {
              type: Type.STRING,
              description: "The winner of the debate. Must be one of: 'user', 'ai', or 'draw'.",
            },
            judgement: {
              type: Type.STRING,
              description: "A brief justification for the decision, explaining the reasoning.",
            },
          },
          required: ["winner", "judgement"],
        },
      },
    });

    const jsonResponse = JSON.parse(response.text);
    
    // Validate the winner string
    const winner = jsonResponse.winner.toLowerCase();
    if (winner !== 'user' && winner !== 'ai' && winner !== 'draw') {
        return { winner: 'draw', judgement: "The judge's decision was unclear, resulting in a draw." };
    }

    return {
        winner: winner as Winner,
        judgement: jsonResponse.judgement,
    };

  } catch (error) {
    console.error("Error determining debate winner:", error);
    return { winner: 'draw', judgement: "An error occurred during the judging process." };
  }
};