import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Initialize OpenAI (as fallback or alternative)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * AI Service to handle text generation using Gemini (primary) or OpenAI (fallback)
 */
export const generateText = async (prompt, systemInstruction = '') => {
  // Try Gemini first (Best free option)
  if (genAI) {
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
    
    for (const modelName of models) {
      try {
        console.log(`Attempting generation with ${modelName}...`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemInstruction 
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        console.error(`${modelName} Error:`, error.message);
        if (error.message.includes('503') || error.message.includes('429') || error.message.includes('high demand')) {
          console.warn(`${modelName} is busy, trying next model...`);
          continue;
        }
        throw error;
      }
    }
  }


  // Fallback to OpenAI
  if (openai) {
    return await generateOpenAI(prompt, systemInstruction);
  }

  // No AI configured
  return `[MOCK AI] No API key configured. This would be the result of your prompt: "${prompt.substring(0, 50)}..."`;
};

const generateOpenAI = async (prompt, systemInstruction) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ]
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI Error:', error);
    throw error;
  }
};
