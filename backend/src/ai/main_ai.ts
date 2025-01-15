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
                type: "object",
                properties: {
                    title: {
                        type: "string"
                    },
                    path: {
                        type: "string"
                    }
                }
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

const zodNavbarItemSchema = z.object({
    title: z.string(),
    path: z.string(),
});

export const zodConceptSchema = z.object({
    title: z.string(),
    concept: z.string(),
    accentColor: z.string(),
    navbar_items: z.array(zodNavbarItemSchema),
});

const generationConfig = {
    temperature: 2,
    topP: 0.95,
    topK: 60,
    maxOutputTokens: 8192,
};

export async function run(seed: number) {
    const chatSession = model.startChat({
        generationConfig: {
            ...generationConfig,
            seed,
            responseMimeType: "application/json",
            responseSchema: conceptSchema,
        },
        history: [
            {
                role: "user",
                parts: [
                    { text: "site idea with online capabilities" },
                    { text: "something crazy, insane, beautiful, never seen before, almost futuristic\n\nthe general theme requires posting in some way, whether it be reviews, text, status, forum post, anything (dont come up with an idea that involves photos or media though. text only ideas)\n\nsome spitball ideas, do NOT reuse it, just sharing for the concept.\n- email client\n- code sharing site\n- Show fansites for shows that dont exist -> but absurd, eg the 3 Shrooms\n- ecommerce for products that dont exist -> but absurd, eg GlarpShaplir, the best way to glarsh the streeps right out\n" },
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

export async function generateHTML(concept: z.infer<typeof zodConceptSchema>, dimension: number, path: string) {
    const model_html = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
    });
    
    const chatSession = model_html.startChat({
        generationConfig: {
            ...generationConfig,
            seed: dimension,
        },
        history: [
            {
                role: "user",
                parts: [
                    { text: JSON.stringify({title: concept.title, concept: concept.concept, accentColor: concept.accentColor}) },
                    { text: `write (*styled*) HTML for the page located at "${path}". Make up whatever API endpoint you need if using any. You are inside the body tag already. Use style tags and style the body tag as well. The page should feature some sort of form>input / form>button to send data to an API. No \`\`\`html, return in plaintext.` },
                ],
            },
        ],
    })
    const result = await chatSession.sendMessage("\n");
    return result.response.text();
}