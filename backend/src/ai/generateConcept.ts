const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
});
const conceptSchema = {
    type: "object",
    properties: {
        title: {
            type: "string"
        },
        concept: {
            type: "string"
        },
        accentColor: {
            type: "string"
        },
        navbar_items: {
            type: "array",
            items: {
                type: "string"
            }
        }
    },
    required: [
        "title",
        "concept",
        "accentColor",
        "navbar_items"
    ]
}

const zodConceptSchema = z.object({
    title: z.string(),
    concept: z.string(),
    accentColor: z.string(),
    navbar_items: z.array(z.string()),
});

const generationConfig = {
    temperature: 2,
    topP: 0.95,
    topK: 60,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema: conceptSchema,
};

export async function run() {
    const chatSession = model.startChat({
        generationConfig,
        history: [
            {
                role: "user",
                parts: [
                    { text: "site idea with online capabilities" },
                    { text: "something crazy, insane, beautiful, never seen before, almost futuristic\n\nthe general theme requires posting in some way, whether it be reviews, text, status, forum post, anything (dont come up with an idea that involves photos though)\n\nsome spitball ideas, do NOT reuse it, just sharing for the concept.\n- email client\n- code sharing site\n- Show fansites for shows that dont exist -> but absurd, eg the 3 Shrooms\n- ecommerce for products that dont exist -> but absurd, eg GlarpShaplir, the best way to glarsh the streeps right out\n" },
                    { text: "pure unhinged insanity" },
                ],
            },
        ],
    });

    const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
    const json = JSON.parse(result.response.text());
    // validate schema
    try {
        const parsed = zodConceptSchema.parse(json);
        return parsed;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
