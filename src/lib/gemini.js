import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let ai;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function analyzeSpeech(transcript, languageCode, speechContext) {
  if (!ai) {
    console.warn("Gemini API key is not set. Returning mock evaluation.");
    return getMockEvaluation(transcript, languageCode);
  }

  if (!transcript || transcript.trim() === '') {
    return getMockEvaluation("No speech detected.", languageCode, "No Speech Detected. Please speak into the microphone.");
  }

  const languageMap = {
    'en-US': 'English',
    'en-IN': 'Indian English',
    'te-IN': 'Telugu',
    'kn-IN': 'Kannada',
    'hi-IN': 'Hindi'
  };
  const targetLanguage = languageMap[languageCode] || 'English';

  const prompt = `
You are an expert, highly refined Human-Centric AI (HCAI) communication coach.
Your goal is to take spoken transcripts and provide the most elegant, grammatically perfect, and contextually appropriate corrections.

Context parameters:
- Language spoken: ${targetLanguage}
- Situation/Goal: ${speechContext}

Transcript: "${transcript}"

Task:
1. Identify filler words in ${targetLanguage}.
2. Estimate the speaking pace (Words Per Minute).
3. Evaluate the confidence score (0-100).
4. Perform a rigorous, highly polished communication analysis:
   - "strengths": Encourage them on what they did well.
   - "corrections": Find any broken sentences, bad grammar, or awkward phrasing.
     IMPORTANT: You MUST provide a highly refined, perfectly grammatical "suggestion" in fluent ${targetLanguage}. The suggestion must sound natural and polished for a ${speechContext}.

Respond ONLY with a valid JSON object matching this schema exactly:
{
  "fillerWords": [
    {"name": "um", "value": 2}
  ],
  "paceData": [
    {"time": 0, "wpm": 0},
    {"time": 30, "wpm": 140}
  ],
  "confidenceScore": 85,
  "insights": {
    "strengths": ["Clear pronunciation."],
    "corrections": [
      {
        "original": "[Extract the exact broken or awkward sentence from the transcript]",
        "mistakeType": "Grammar & Polish",
        "suggestion": "[Provide the highly refined, grammatically perfect version in ${targetLanguage}]",
        "explanation": "[Explain why this refined version sounds better for a ${speechContext}]"
      }
    ]
  }
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    const jsonStr = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Error analyzing speech with Gemini:", error);
    let errorMsg = "An unknown error occurred connecting to the AI.";
    if (error.message) {
      if (error.message.includes("429") || error.message.includes("quota")) {
        errorMsg = "API Quota Exceeded. You have used all your free requests for today. Please wait or use a different key.";
      } else {
        errorMsg = "API Error: " + error.message.substring(0, 100);
      }
    }
    return getMockEvaluation(transcript, languageCode, errorMsg);
  }
}

export async function chatWithCoach(messageHistory, languageCode, speechContext) {
  if (!ai) {
    return "API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file to talk with the AI Coach.";
  }

  const languageMap = {
    'en-US': 'English',
    'en-IN': 'Indian English',
    'te-IN': 'Telugu',
    'kn-IN': 'Kannada',
    'hi-IN': 'Hindi'
  };
  const targetLanguage = languageMap[languageCode] || 'English';

  const systemInstruction = `
You are Aura, an elite, empathetic AI conversational partner and communication mentor.
Your goal is to have natural, engaging, and educational conversations with the user based on the selected Context: [${speechContext}].

CRITICAL RULES:
1. ENGAGE IN THE CONVERSATION: If the user asks a question, answer it naturally! If it's a 'Job Interview', act as the interviewer. If it's 'Casual', chat casually with an educational tone.
2. GENTLE COACHING: If the user uses awkward grammar or phrasing, gently slip in a quick tip *after* answering their main point (e.g., "By the way, instead of saying X, it sounds a bit more natural to say Y!").
3. Keep all responses EXTREMELY short and conversational (1 to 3 sentences max). You are speaking to them out loud in real-time. NO long essays or bulleted lists.
4. Language: You must respond in the same language the user speaks, but default to [${targetLanguage}] if unsure.
5. Be warm, supportive, and educational.
`;

  // Format history for Gemini SDK
  const formattedHistory = messageHistory.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      }
    });

    // If there is history, we need to send the last message via sendMessage, 
    // and ideally the rest via history. The new @google/genai SDK allows passing history to chats.create.
    // Wait, in @google/genai, `history` is passed in config or we just send messages.
    // Let's manually inject the context if history passing is complex, or use the simplest approach: 
    // Send the entire conversation as a single prompt with strict formatting, or use the SDK history.
    // Given standard stateless API patterns, we'll build a complete prompt text to ensure reliability.
    
    let conversationText = systemInstruction + "\n\n--- CONVERSATION HISTORY ---\n";
    messageHistory.forEach(msg => {
      conversationText += `${msg.role === 'ai' ? 'AI Mentor' : 'User'}: ${msg.content}\n`;
    });
    conversationText += "AI Mentor: ";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: conversationText,
    });

    return response.text.trim();

  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting to the network right now. Please try again.";
  }
}

function getMockEvaluation(transcript, languageCode, customErrorMsg = null) {
  const shortTranscript = transcript.length > 50 ? transcript.substring(0, 50) + "..." : transcript;
  
  const mistakeType = customErrorMsg ? "AI Connection Issue" : "API Key Missing";
  const suggestion = customErrorMsg || "Please add your VITE_GEMINI_API_KEY in the .env file to get real, refined grammar corrections.";
  const explanation = customErrorMsg ? customErrorMsg : "The app is currently running in 'Mock Mode' because it cannot connect to the Gemini AI.";

  return {
    fillerWords: [
      { name: 'um', value: 2 }
    ],
    paceData: [
      { time: 0, wpm: 0 },
      { time: 30, wpm: 125 }
    ],
    confidenceScore: 78,
    insights: {
      strengths: [
        "Your message has a good underlying structure.",
        customErrorMsg ? "Note: We are showing this placeholder because the AI is temporarily unavailable." : "Remember to add your Gemini API Key to see real AI analysis!"
      ],
      corrections: [
        {
          original: shortTranscript || "[No speech detected]",
          mistakeType: mistakeType,
          suggestion: suggestion,
          explanation: explanation
        }
      ]
    }
  };
}
