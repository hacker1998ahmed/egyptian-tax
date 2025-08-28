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

export const getTaxPlanningAdvice = async (financialSummary: string): Promise<string> => {
    const systemInstruction = `
        أنت مستشار ضرائب مصري خبير ومحترف. 
        مهمتك هي تحليل الملخص المالي التالي لشركة صغيرة في مصر وتقديم 3 إلى 5 نصائح قصيرة وعملية وقانونية لتحسين الوضع الضريبي أو الاستفادة من المزايا المتاحة في قانون الضرائب المصري.

        قواعد:
        1.  يجب أن تكون النصائح مخصصة للأرقام المقدمة. لا تقدم نصائح عامة.
        2.  اذكر بإيجاز سبب أهمية كل نصيحة.
        3.  استخدم تنسيق Markdown بسيط (مثل القوائم النقطية *).
        4.  يجب أن تكون اللغة المستخدمة هي العربية.
        5.  اختتم دائمًا بالفقرة التالية حرفيًا: "إخلاء مسؤولية: هذه النصائح هي لأغراض إرشادية فقط بناءً على البيانات المقدمة ولا تعتبر استشارة قانونية أو مالية ملزمة. يوصى دائمًا باستشارة محاسب قانوني معتمد لاتخاذ قرارات مالية."
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: financialSummary,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching tax planning advice from Gemini:", error);
        throw new Error("error.gemini.generic");
    }
};

export const getPerformanceAnalysisInsight = async (analysisSummary: string): Promise<string> => {
    const systemInstruction = `
        أنت محلل أعمال ذكي. مهمتك هي تحليل المقارنة التالية بين أداء شركة ومتوسط أداء قطاعها.
        قدم رؤية قصيرة جداً (جملة واحدة أو جملتين) بناءً على هذه المقارنة.
        - إذا كان الأداء أعلى من المتوسط، قدم تشجيعًا مع اقتراح بسيط للحفاظ على التفوق.
        - إذا كان الأداء أقل من المتوسط، قدم نصيحة بناءة وعملية للتحسين.
        - إذا كان الأداء مطابقًا للمتوسط، اذكر أن الأداء جيد واقترح مجالاً للتميز.
        - يجب أن تكون اللغة المستخدمة هي العربية.
        - لا تقم بتضمين أي إخلاء مسؤولية. كن موجزًا ومباشرًا.

        مثال للمدخلات: "هامش الربح الصافي لشركتي 7%، بينما متوسط القطاع 5%."
        مثال للمخرجات: "أداؤك ممتاز ويتفوق على متوسط قطاعك! حافظ على هذا التركيز على إدارة التكاليف لضمان استمرارية هذا النجاح."
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: analysisSummary,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
                thinkingConfig: { thinkingBudget: 0 } // Low latency for quick feedback
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching performance insight from Gemini:", error);
        throw new Error("error.gemini.generic");
    }
};

export const getTaxForecastInsight = async (forecastSummary: string): Promise<string> => {
    const systemInstruction = `
        أنت مستشار مالي موجز. مهمتك هي تحليل التنبؤ الضريبي التالي لشركة صغيرة.
        قدم نصيحة واحدة قصيرة جدًا وقابلة للتنفيذ (جملة أو جملتين) لمساعدتهم على الاستعداد لهذا الالتزام الضريبي.
        - ركز على التخطيط المالي، مثل تخصيص الأموال أو مراجعة النفقات.
        - يجب أن تكون اللغة المستخدمة هي العربية.
        - كن مباشرًا ومشجعًا. لا تقم بتضمين أي إخلاء مسؤولية.

        مثال للمدخلات: "من المتوقع أن تبلغ الضريبة السنوية المستحقة 150,000 جنيه مصري."
        مثال للمخرجات: "استعدادًا ممتازًا! ابدأ بتجنيب حوالي 12,500 جنيه شهريًا لتغطية هذا الالتزام الضريبي بسهولة في نهاية العام."
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: forecastSummary,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
                thinkingConfig: { thinkingBudget: 0 } // Low latency
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching tax forecast insight from Gemini:", error);
        throw new Error("error.gemini.generic");
    }
};