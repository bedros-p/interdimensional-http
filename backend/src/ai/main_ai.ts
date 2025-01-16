const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");
import Groq from 'groq-sdk';

import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const client = new Groq({
    apiKey: process.env['GROQ_API_KEY'],
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

export async function conceptJSON(seed: number) {

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    });

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
                    { text: `COME UP WITH something insane, beautiful, never seen before, almost futuristic but not quite - definitely goofy, but use deadpan humor. whatever you come up with everything is totally real.

the general theme requires posting in some way, whether it be reviews, text, status, forum post, anything (dont come up with an idea that involves photos though)

do not make references to the word "absurd" in any way. treat it as if its a real concept.` },
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
    const model_groq = "mixtral-8x7b-32768"
    console.log("Generating HTML");
    const { navbar_items, ...concept_trimmed } = concept;
    const result = await client.chat.completions.create({
        model: model_groq,
        messages : [
            { role: "user", content: JSON.stringify(concept_trimmed) },
            { role: "user", content: `write (*styled* [sleek, modern, minimalistic, futuristic - you can use bootstrap, it's all bundled in. site gotta be in dark mode though] - your view is in the "body>main" tag. do not modify width & height of body, or the layout. For layout, use your container.) HTML for the page located at "${path}". Make up whatever API endpoint you need if using any. You are inside the body tag already. Use style tags and style the body tag as well. The page, if not on / or if it really has API interaction, should feature some sort of form>input / form>button to send data to an API. No \`\`\`html, return in plaintext.` },
        ],
    });
    return result.choices[0].message.content;
}
