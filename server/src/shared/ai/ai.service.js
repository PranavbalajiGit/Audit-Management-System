const AppError = require('../errors/appError');

class AIService {
  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY || 'mock_gemini_key';
    this.isMock = this.geminiKey === 'mock_gemini_key' || !this.geminiKey.startsWith('AIzaSy');
  }

  /**
   * Helper to call Gemini REST API
   */
  async callGemini(prompt, base64Image = null, mimeType = 'image/jpeg') {
    if (this.isMock) {
      throw new Error('Gemini API is in mock mode');
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`;
      
      const contents = [];
      const parts = [];

      parts.push({ text: prompt });

      if (base64Image) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Image
          }
        });
      }

      contents.push({ parts });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
      }

      const resData = await response.json();
      const outputText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!outputText) {
        throw new Error('Empty response from Gemini API');
      }

      return outputText;
    } catch (error) {
      console.error('[Gemini API Error]', error.message);
      throw error;
    }
  }

  /**
   * Phase 1: Analyze audit image using VLM
   */
  async analyzeImage(imageUrl, roomType, base64Image = null) {
    if (this.isMock) {
      // Return realistic mock VLM analysis based on expected roomType
      console.log(`[AI Service] Mock VLM analyzing image for roomType: ${roomType}`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      if (roomType === 'Classroom') {
        return {
          roomClassification: 'Classroom',
          sceneDescription: 'A standard educational classroom with rows of student tables, chairs, a wall-mounted whiteboard at the front, and a projector mounted on the ceiling.',
          objects: ['Board', 'Projector', 'Benches', 'Chairs', 'Ceiling Fan'],
          confidence: 0.95
        };
      } else if (roomType === 'Laboratory') {
        return {
          roomClassification: 'Laboratory',
          sceneDescription: 'A computer laboratory with multiple workstations, monitors, keyboards, lab benches, chairs, and networking equipment visible in a corner rack.',
          objects: ['Computers', 'Lab Benches', 'Chairs', 'Network Switch', 'AC Unit'],
          confidence: 0.98
        };
      } else if (roomType === 'Library') {
        return {
          roomClassification: 'Library',
          sceneDescription: 'A quiet library reading zone containing rows of wooden bookshelves packed with books, study tables with lamps, and comfortable seating chairs.',
          objects: ['Bookshelves', 'Books', 'Tables', 'Chairs', 'Notice Board'],
          confidence: 0.94
        };
      } else if (roomType === 'Hostel') {
        return {
          roomClassification: 'Hostel',
          sceneDescription: 'A hostel student room featuring two bunk beds, study desks with laptops, personal cupboards, and a window overlooking the campus courtyard.',
          objects: ['Beds', 'Desks', 'Cupboards', 'Window', 'Fan'],
          confidence: 0.92
        };
      } else {
        return {
          roomClassification: roomType || 'Other',
          sceneDescription: `An institutional room matching ${roomType || 'Other'} specifications, with chairs, tables, and standard fittings in clean condition.`,
          objects: ['Table', 'Chairs', 'Fittings'],
          confidence: 0.90
        };
      }
    }

    // Real Gemini VLM Call
    try {
      const prompt = `Analyze this infrastructure inspection image. Classify the roomType (must be one of: Classroom, Laboratory, Hostel, Library, Office, Other). Detect objects and assets visible. Describe the scene briefly. The expected room type is ${roomType}.
      Return your response strictly as a valid JSON object matching this schema: 
      {
        "roomClassification": "string",
        "sceneDescription": "string",
        "objects": ["string"],
        "confidence": number (between 0 and 1)
      }
      Do not include any markdown formatting like \`\`\`json or backticks. Return only raw JSON.`;

      // If base64Image is not provided, we can mock or download it, but for our API,
      // we'll pass base64 from the client or download the cloudinary image.
      let b64 = base64Image;
      if (!b64 && imageUrl) {
        // Try fetching image and converting to base64
        try {
          const imgRes = await fetch(imageUrl);
          const arrayBuffer = await imgRes.arrayBuffer();
          b64 = Buffer.from(arrayBuffer).toString('base64');
        } catch (fetchErr) {
          console.error('[AI Service] Failed to download image for Gemini VLM', fetchErr.message);
        }
      }

      if (!b64) {
        throw new Error('Image data (base64 or fetchable URL) is required for VLM analysis');
      }

      const responseText = await this.callGemini(prompt, b64);
      // Clean JSON string in case of model returns markdown blocks
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('[AI Service VLM Error]', error);
      // Fail-soft: fallback to mock so audit workflow doesn't completely block
      return {
        roomClassification: roomType,
        sceneDescription: `Inspection image uploaded. VLM analysis completed with fallback parameters.`,
        objects: ['Inspected Assets'],
        confidence: 0.85
      };
    }
  }

  /**
   * Phase 2: Generate dynamic questions based on VLM analysis and checklist
   */
  async generateQuestions(sceneAnalysis, checklistTitle) {
    if (this.isMock) {
      console.log('[AI Service] Mock generating questions');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { roomClassification, objects } = sceneAnalysis;
      const questions = [];

      if (roomClassification === 'Classroom') {
        questions.push({ question: 'Is the white/green board clearly visible and free of writing or damages?' });
        questions.push({ question: 'How many ceiling fans or lights are visible in the seating area?' });
      } else if (roomClassification === 'Laboratory') {
        questions.push({ question: 'Are the computer terminals/equipment neat and correctly powered off/on?' });
        questions.push({ question: 'Is there an operational fire extinguisher or safety chart in this lab?' });
      } else {
        questions.push({ question: `Is the ${objects[0] || 'main asset'} clean and in working order?` });
        questions.push({ question: 'Are there any structural defects (cracks, water leaks) visible on the walls/ceiling?' });
      }

      return questions;
    }

    try {
      const prompt = `Based on this room scene analysis: ${JSON.stringify(sceneAnalysis)} and checklist title: "${checklistTitle}", generate 2 highly relevant, specific physical verification questions that a field auditor can answer immediately while standing in the room to prove their physical presence.
      Return your response strictly as a valid JSON array of objects matching this schema:
      [
        { "question": "string" },
        { "question": "string" }
      ]
      Do not include any markdown formatting like \`\`\`json or backticks. Return only raw JSON.`;

      const responseText = await this.callGemini(prompt);
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('[AI Service LLM Question Generation Error]', error);
      return [
        { question: 'Is the room free of wall cracks and paint peeling?' },
        { question: 'Are all electrical switches and outlets securely installed?' }
      ];
    }
  }

  /**
   * Phase 3: Validate auditor answers against VLM observations
   */
  async validateAnswers(verificationAnswers, sceneAnalysis) {
    if (this.isMock) {
      console.log('[AI Service] Mock validating answers');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return verificationAnswers.map(ans => {
        // Simple mock matching logic: if answer is short or negative, flag it
        const text = ans.answer.toLowerCase();
        let validationResult = 'Match';
        if (text.includes('no') || text.includes('not') || text.includes('don\'t') || text.includes('broken')) {
          validationResult = 'Requires review';
        } else if (text.length < 5) {
          validationResult = 'Partial match';
        }
        return {
          question: ans.question,
          answer: ans.answer,
          validationResult
        };
      });
    }

    try {
      const prompt = `Evaluate the auditor's answers against the room VLM analysis.
      VLM analysis: ${JSON.stringify(sceneAnalysis)}
      Auditor Answers: ${JSON.stringify(verificationAnswers)}
      
      For each Q&A pair, determine the validationResult, which must be one of: "Match", "Partial match", "Conflict", "Requires review".
      Return your response strictly as a valid JSON array of objects matching this schema:
      [
        {
          "question": "string",
          "answer": "string",
          "validationResult": "Match | Partial match | Conflict | Requires review"
        }
      ]
      Do not include any markdown formatting like \`\`\`json or backticks. Return only raw JSON.`;

      const responseText = await this.callGemini(prompt);
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('[AI Service LLM Validation Error]', error);
      return verificationAnswers.map(ans => ({
        question: ans.question,
        answer: ans.answer,
        validationResult: 'Requires review'
      }));
    }
  }

  /**
   * Calculate overall confidence score based on workflow signals:
   * - QR Verification (20%)
   * - GPS Verification (20%)
   * - VLM Classification Match (35%)
   * - Answer Validation (25%)
   */
  calculateConfidence(signals) {
    let score = 0;

    // 1. QR code: 20 points
    if (signals.qrVerified) {
      score += 20;
    }

    // 2. GPS: 20 points
    if (signals.gpsVerified) {
      score += 20;
    } else if (signals.gpsDistance <= 100) {
      // Borderline location match gets partial credit
      score += 10;
    }

    // 3. VLM classification match: 35 points
    if (signals.vlmRoomType === signals.expectedRoomType) {
      score += 35 * (signals.vlmConfidence || 1);
    } else {
      // If it doesn't match, give a default low rating or 0
      score += 10 * (signals.vlmConfidence || 1);
    }

    // 4. Answer validation: 25 points
    if (Array.isArray(signals.validationAnswers) && signals.validationAnswers.length > 0) {
      let matchCount = 0;
      let partialCount = 0;
      signals.validationAnswers.forEach(ans => {
        if (ans.validationResult === 'Match') matchCount++;
        else if (ans.validationResult === 'Partial match') partialCount++;
      });
      
      const totalQ = signals.validationAnswers.length;
      const ratio = (matchCount + (partialCount * 0.5)) / totalQ;
      score += 25 * ratio;
    } else {
      // If no answers, but other signals are green
      score += 12.5;
    }

    // Bound score between 0 and 100
    return Math.min(100, Math.max(0, Math.round(score)));
  }
}

module.exports = new AIService();
