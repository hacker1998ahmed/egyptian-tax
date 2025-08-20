import { GoogleGenAI, Chat } from "@google/genai";

if (!process.env.API_KEY) {
  // In a real app, this would be handled more gracefully.
  // For this environment, we simulate an error if the key is missing.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const startTaxChat = (): Chat => {
    const systemInstruction = `
        أنت خبير ضرائب وتأمينات مصري محترف ومساعد. 
        مهمتك هي الإجابة على استفسارات المستخدمين حول قوانين الضرائب والتأمينات في جمهورية مصر العربية. 
        - قدم إجابات واضحة وموجزة ومبنية على القوانين السارية.
        - لا تقدم نصائح مالية أو قانونية شخصية ملزمة، بل قدم معلومات عامة لأغراض استرشادية.
        - إذا لم تكن متأكدًا من إجابة، اذكر ذلك واقترح على المستخدم استشارة محاسب قانوني.
        - حافظ على لهجة احترافية ومفيدة.
        - ابدأ المحادثة دائماً برسالة ترحيبية قصيرة.
    `;
    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.5,
        },
    });
    return chat;
};