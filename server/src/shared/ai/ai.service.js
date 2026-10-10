const AppError = require('../errors/appError');

class AIService {
  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY || '';
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    this.ollamaKey = process.env.OLLAMA_API_KEY || '';
    this.ollamaHost = (process.env.OLLAMA_HOST || 'https://ollama.com').replace(/\/+$/, '');
    this.ollamaModel = process.env.OLLAMA_MODEL || 'gemma4:31b';

    const geminiReady = Boolean(this.geminiKey && this.geminiKey.startsWith('AIzaSy'));
    const ollamaReady = Boolean(this.ollamaKey && this.ollamaKey !== 'mock_ollama_key');

    const requested = (process.env.AI_PROVIDER || '').toLowerCase().trim();
    if (requested === 'mock') {
      this.provider = 'mock';
    } else if (requested === 'gemini' && geminiReady) {
      this.provider = 'gemini';
    } else if (requested === 'ollama' && ollamaReady) {
      this.provider = 'ollama';
    } else if (ollamaReady) {
      // Prefer Ollama Cloud when a key is configured
      this.provider = 'ollama';
    } else if (geminiReady) {
      this.provider = 'gemini';
    } else {
      this.provider = 'mock';
    }

    this.isMock = this.provider === 'mock';

    console.log(
      `[AI Service] Provider: ${this.provider}` +
        (this.provider === 'ollama' ? ` (model: ${this.ollamaModel} @ ${this.ollamaHost})` : '') +
        (this.provider === 'mock' ? ' — no valid AI key found, using mock responses' : '')
    );
  }

  /**
   * Strip a data URI prefix (e.g. data:image/jpeg;base64,) from a base64 payload.
   */
  stripDataUri(base64) {
    return String(base64).replace(/^data:[^;]+;base64,/, '');
  }

  /**
   * Extract the first JSON object/array from a model response, tolerating
   * markdown code fences and surrounding prose.
   */
  parseJson(text) {
    if (!text) {
      throw new Error('Empty AI response');
    }
    let clean = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(clean);
    } catch (err) {
      const firstObj = clean.indexOf('{');
      const firstArr = clean.indexOf('[');
      const start = firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
      const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
      if (start !== -1 && end > start) {
        return JSON.parse(clean.slice(start, end + 1));
      }
      throw new Error(`Failed to parse AI JSON response: ${err.message}`);
    }
  }

  /**
   * Helper to call Gemini REST API
   */
  async callGemini(prompt, base64Image = null, mimeType = 'image/jpeg') {
    if (!this.geminiKey) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`;

      const parts = [{ text: prompt }];
      if (base64Image) {
        parts.push({
          inlineData: {
            mimeType,
            data: this.stripDataUri(base64Image)
          }
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents: [{ parts }] })
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
   * Helper to call Ollama (Cloud or self-hosted) native /api/chat endpoint.
   * Vision images are sent via the native `images` array (base64, no data URI).
   */
  async callOllama(prompt, base64Image = null, jsonSchema = null) {
    if (!this.ollamaKey) {
      throw new Error('Ollama API key is not configured');
    }

    try {
      const url = `${this.ollamaHost}/api/chat`;

      const message = { role: 'user', content: prompt };
      if (base64Image) {
        message.images = [this.stripDataUri(base64Image)];
      }

      const body = {
        model: this.ollamaModel,
        messages: [message],
        stream: false
      };

      // Native structured outputs: force the model to return schema-conforming JSON
      if (jsonSchema) {
        body.format = jsonSchema;
      }

      const imageInfo = base64Image
        ? `image=${Math.round(this.stripDataUri(base64Image).length / 1024)}KB`
        : 'image=none (text-only)';
      console.log(`[Ollama] -> POST ${url} model=${this.ollamaModel} ${imageInfo} format=${jsonSchema ? 'json-schema' : 'free-text'}`);
      const startedAt = Date.now();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.ollamaKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Ollama] <- ${response.status} after ${Date.now() - startedAt}ms: ${errText.slice(0, 300)}`);
        throw new Error(`Ollama API returned status ${response.status}: ${errText}`);
      }

      const resData = await response.json();
      const outputText = resData.message?.content;

      console.log(`[Ollama] <- 200 OK in ${Date.now() - startedAt}ms (${outputText ? outputText.length : 0} chars)`);

      if (!outputText) {
        throw new Error('Empty response from Ollama API');
      }

      return outputText;
    } catch (error) {
      console.error('[Ollama API Error]', error.message);
      throw error;
    }
  }

  /**
   * Provider-agnostic LLM/VLM call.
   */
  async callLLM(prompt, base64Image = null, jsonSchema = null) {
    if (this.provider === 'ollama') {
      return this.callOllama(prompt, base64Image, jsonSchema);
    }
    if (this.provider === 'gemini') {
      return this.callGemini(prompt, base64Image);
    }
    throw new Error('AI provider is in mock mode');
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

    const prompt = `Analyze this infrastructure inspection image. Classify the roomType (must be one of: Classroom, Laboratory, Hostel, Library, Office, Other). Detect objects and assets visible. Describe the scene briefly. The expected room type is ${roomType}.
    Return your response strictly as a valid JSON object matching this schema:
    {
      "roomClassification": "string",
      "sceneDescription": "string",
      "objects": ["string"],
      "confidence": number (between 0 and 1)
    }
    Do not include any markdown formatting like \`\`\`json or backticks. Return only raw JSON.`;

    // Resolve image bytes: prefer provided base64, otherwise fetch the URL.
    let b64 = base64Image;
    if (!b64 && imageUrl) {
      try {
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) {
          throw new Error(`status ${imgRes.status}`);
        }
        const arrayBuffer = await imgRes.arrayBuffer();
        b64 = Buffer.from(arrayBuffer).toString('base64');
      } catch (fetchErr) {
        console.error('[AI Service] Failed to download image for VLM analysis', fetchErr.message);
      }
    }

    if (!b64) {
      throw new AppError('Image data (base64 or fetchable URL) is required for VLM analysis', 400);
    }

    try {
      console.log(`[VLM] Analyzing real image via provider="${this.provider}" model="${this.ollamaModel}" bytes=${b64.length} expectedRoomType="${roomType}"`);
      const jsonSchema = {
        type: 'object',
        properties: {
          roomClassification: { type: 'string' },
          sceneDescription: { type: 'string' },
          objects: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number' }
        },
        required: ['roomClassification', 'sceneDescription', 'objects', 'confidence']
      };

      const responseText = await this.callLLM(prompt, b64, jsonSchema);
      const parsed = this.parseJson(responseText);

      const result = {
        roomClassification: parsed.roomClassification || roomType,
        sceneDescription: parsed.sceneDescription || '',
        objects: Array.isArray(parsed.objects) ? parsed.objects : [],
        confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.8
      };
      console.log(`[VLM] Result: classification="${result.roomClassification}" objects=[${result.objects.join(', ')}] confidence=${result.confidence}`);
      return result;
    } catch (error) {
      console.error('[AI Service VLM Error]', error.message);
      throw new AppError(`Image analysis failed: ${error.message}`, 502);
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

    const prompt = `Based on this room scene analysis: ${JSON.stringify(sceneAnalysis)} and checklist title: "${checklistTitle}", generate 2 highly relevant, specific physical verification questions that a field auditor can answer immediately while standing in the room to prove their physical presence.
    Return your response strictly as a valid JSON array of objects matching this schema:
    [
      { "question": "string" },
      { "question": "string" }
    ]
    Do not include any markdown formatting like \`\`\`json or backticks. Return only raw JSON.`;

    try {
      const jsonSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: { question: { type: 'string' } },
          required: ['question']
        }
      };

      const responseText = await this.callLLM(prompt, null, jsonSchema);
      const parsed = this.parseJson(responseText);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Model did not return a non-empty question array');
      }

      return parsed
        .filter(q => q && typeof q.question === 'string' && q.question.trim())
        .map(q => ({ question: q.question.trim() }));
    } catch (error) {
      console.error('[AI Service LLM Question Generation Error]', error.message);
      throw new AppError(`Question generation failed: ${error.message}`, 502);
    }
  }

  /**
   * Phase 3: Validate auditor answers against VLM observations.
   * Optionally re-checks the room image to match each answer visually.
   */
  async validateAnswers(verificationAnswers, sceneAnalysis, base64Image = null) {
    if (this.isMock) {
      console.log('[AI Service] Mock validating answers');
      await new Promise(resolve => setTimeout(resolve, 500));

      return verificationAnswers.map(ans => {
        // Simple mock matching logic: if answer is short or negative, flag it
        const text = (ans.answer || '').toLowerCase();
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

    const prompt = `You are verifying whether a field auditor physically inspected a room. Compare the auditor's answers with the attached room image (if provided) and the VLM analysis of that image.

    VLM analysis: ${JSON.stringify(sceneAnalysis)}
    Auditor Answers: ${JSON.stringify(verificationAnswers)}

    For each Q&A pair, determine the validationResult, which must be one of: "Match", "Partial match", "Conflict", "Requires review".
    - "Match": the answer is consistent with what the image/VLM analysis shows.
    - "Partial match": answer is plausible but vague or only partially supported.
    - "Conflict": answer directly contradicts the image/VLM analysis.
    - "Requires review": cannot be determined from the image.

    Return your response strictly as a valid JSON array of objects matching this schema:
    [
      {
        "question": "string",
        "answer": "string",
        "validationResult": "Match | Partial match | Conflict | Requires review"
      }
    ]
    Do not include any markdown formatting like \`\`\`json or backticks. Return only raw JSON.`;

    const VALID = ['Match', 'Partial match', 'Conflict', 'Requires review'];

    try {
      const jsonSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            answer: { type: 'string' },
            validationResult: { type: 'string', enum: VALID }
          },
          required: ['question', 'answer', 'validationResult']
        }
      };

      const responseText = await this.callLLM(prompt, base64Image, jsonSchema);
      const parsed = this.parseJson(responseText);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Model did not return a non-empty validation array');
      }

      // Preserve the auditor's original question/answer text and map verdicts back in order.
      return verificationAnswers.map((ans, i) => {
        const match = parsed.find(p => p && p.question === ans.question) || parsed[i] || {};
        const verdict = VALID.includes(match.validationResult) ? match.validationResult : 'Requires review';
        return {
          question: ans.question,
          answer: ans.answer,
          validationResult: verdict
        };
      });
    } catch (error) {
      console.error('[AI Service LLM Validation Error]', error.message);
      throw new AppError(`Answer validation failed: ${error.message}`, 502);
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
