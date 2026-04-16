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
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction 
      });

      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini AI Error:', error);
      // Fallback to OpenAI if Gemini fails and OpenAI is available
      if (openai) {
        return await generateOpenAI(prompt, systemInstruction);
      }
      throw error;
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
