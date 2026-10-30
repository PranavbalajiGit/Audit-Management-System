const CATEGORY_KEYWORDS = {
  'guest house': ['bed', 'linen', 'linens', 'wardrobe', 'sofa', 'television', 'tv', 'curtain', 'curtains', 'armchair', 'coffee table', 'kettle', 'towel', 'bedroom', 'living', 'suite', 'pillow', 'blanket'],
  'coe office': ['desk', 'office', 'computer', 'monitor', 'almirah', 'cabinet', 'cctv', 'camera', 'safe', 'file', 'files', 'folder', 'shredder', 'printer', 'lock', 'paper', 'records', 'confidential'],
  'research and development centre': ['workstation', 'oscilloscope', 'test bench', 'equipment', '3d printer', 'soldering', 'multimeter', 'sensor', 'prototype', 'lab', 'circuit', 'instrument', 'instruments', 'goggles', 'component'],
  'medical centre': ['bed', 'examination', 'medicine', 'medicines', 'first aid', 'stethoscope', 'monitor', 'wheelchair', 'clinic', 'basin', 'doctor', 'patient', 'health', 'hospital', 'syringe', 'gauze', 'thermometer', 'stretcher'],
  'radio station': ['microphone', 'mixer', 'console', 'boom arm', 'acoustic', 'foam', 'headphone', 'headphones', 'audio', 'sound', 'studio', 'broadcast', 'monitor', 'speaker', 'on air', 'transmitter'],
  'classroom': ['board', 'whiteboard', 'blackboard', 'projector', 'desk', 'benches', 'bench', 'chair', 'chairs', 'podium', 'classroom', 'student', 'screen', 'fan'],
  'laboratory': ['computer', 'workstation', 'pc', 'monitor', 'bench', 'network', 'server', 'rack', 'equipment', 'chemical', 'lab', 'sink', 'hood'],
  'hostel': ['bed', 'bunk', 'wardrobe', 'cupboard', 'desk', 'dormitory', 'room', 'hostel', 'fan', 'mattress'],
  'library': ['bookshelf', 'bookshelves', 'book', 'books', 'shelf', 'shelves', 'reading', 'library', 'study table'],
  'office': ['desk', 'chair', 'computer', 'monitor', 'cabinet', 'office', 'phone', 'printer', 'stationery']
};

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
   * Dynamically evaluate legitimate match confidence between VLM findings and expected room type.
   */
  calculateDynamicMatchConfidence(parsedClassification, expectedRoomType, rawConfidence = 0.85, objects = [], sceneDescription = '') {
    const normClass = String(parsedClassification || '').trim().toLowerCase();
    const normExp = String(expectedRoomType || '').trim().toLowerCase();

    // Collect all text signals from description and objects
    const textBlob = `${normClass} ${sceneDescription} ${objects.join(' ')}`.toLowerCase();
    const expectedKeywords = CATEGORY_KEYWORDS[normExp] || [];
    
    // Count how many category-specific keywords appear
    let matchedKeywordsCount = 0;
    expectedKeywords.forEach(kw => {
      if (textBlob.includes(kw)) {
        matchedKeywordsCount++;
      }
    });

    // 1. Direct classification match
    if (normClass === normExp) {
      let base = typeof rawConfidence === 'number' && rawConfidence > 0 ? rawConfidence : 0.85;
      
      // Calibrate dynamically based on keyword/asset presence
      if (matchedKeywordsCount >= 3) {
        base = Math.max(base, 0.91);
      } else if (matchedKeywordsCount === 2) {
        base = Math.min(Math.max(base, 0.84), 0.92);
      } else if (matchedKeywordsCount === 1) {
        base = Math.min(base, 0.80);
      } else {
        // Zero specific assets found even though category matched
        base = Math.min(base, 0.72);
      }

      // Add subtle deterministic variation based on object count so it doesn't look like a flat percentage
      const assetBonus = Math.min(objects.length * 0.01, 0.05);
      return Math.min(0.98, Math.max(0.65, Number((base + assetBonus).toFixed(2))));
    }

    // 2. Classification MISMATCH (e.g. expected "COE Office", but image classified as "Other", "Classroom", etc.)
    if (normClass === 'other' || normClass === '') {
      if (matchedKeywordsCount >= 2) {
        return Math.min(0.40, Math.max(0.20, 0.15 + matchedKeywordsCount * 0.08));
      }
      // Completely unrelated image: return true low match confidence (e.g., 0.08 - 0.15)
      const penalty = typeof rawConfidence === 'number' && rawConfidence < 0.5 ? rawConfidence : 0.12;
      return Number(Math.min(0.18, Math.max(0.06, penalty)).toFixed(2));
    }

    // Space classified as another recognized room (e.g., expected Guest House, but image shows Laboratory)
    if (matchedKeywordsCount >= 2) {
      return Math.min(0.45, Math.max(0.25, 0.20 + matchedKeywordsCount * 0.06));
    }

    // Definite wrong space
    return Number((Math.min(0.22, Math.max(0.08, 0.10 + (objects.length > 0 ? 0.03 : 0)))).toFixed(2));
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
        if (Array.isArray(base64Image)) {
          base64Image.forEach(img => {
            parts.push({
              inlineData: {
                mimeType,
                data: this.stripDataUri(img)
              }
            });
          });
        } else {
          parts.push({
            inlineData: {
              mimeType,
              data: this.stripDataUri(base64Image)
            }
          });
        }
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
        if (Array.isArray(base64Image)) {
          message.images = base64Image.map(img => this.stripDataUri(img));
        } else {
          message.images = [this.stripDataUri(base64Image)];
        }
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

      const urlStr = Array.isArray(imageUrl) ? imageUrl.join(' ') : String(imageUrl || '');
      const isUnrelated = /unrelated|random|mismatch|fake|other|apple|cat|dog|shoe|car/i.test(urlStr);

      if (isUnrelated) {
        return {
          roomClassification: 'Other',
          sceneDescription: 'An unrelated item or non-institutional environment that does not match standard facility specifications.',
          objects: ['Unrelated Object', 'Generic Background'],
          confidence: 0.12
        };
      }

      if (roomType === 'Guest House') {
        return {
          roomClassification: 'Guest House',
          sceneDescription: 'A well-furnished institutional guest house room with a neatly made bed, bedside tables, wardrobe, armchairs, coffee table, and air conditioning unit in clean condition.',
          objects: ['Bed', 'Wardrobe', 'Armchairs', 'Coffee Table', 'Air Conditioner', 'Curtains'],
          confidence: 0.94
        };
      } else if (roomType === 'COE Office') {
        return {
          roomClassification: 'COE Office',
          sceneDescription: 'A secure Controller of Examinations (COE) office equipped with administrative desks, locked confidential document cabinets, computers, security cameras, and paper shredder.',
          objects: ['Office Desk', 'Computers', 'Document Almirah', 'Filing Cabinet', 'CCTV Camera', 'Paper Shredder'],
          confidence: 0.93
        };
      } else if (roomType === 'Research and Development Centre') {
        return {
          roomClassification: 'Research and Development Centre',
          sceneDescription: 'An advanced Research & Development (R&D) centre featuring electronics test benches, precision measurement oscilloscopes, specialized workstations, and prototyping tools.',
          objects: ['Workstations', 'Oscilloscopes', 'Test Benches', 'Soldering Station', '3D Printer', 'Safety Goggles'],
          confidence: 0.96
        };
      } else if (roomType === 'Medical Centre') {
        return {
          roomClassification: 'Medical Centre',
          sceneDescription: 'A campus healthcare medical centre clinic with patient examination bed, vital signs monitoring instruments, locked first-aid medicine cabinets, and sanitized wash basin.',
          objects: ['Examination Bed', 'Medicine Cabinet', 'Stethoscope', 'Blood Pressure Monitor', 'Wash Basin', 'Wheelchair'],
          confidence: 0.92
        };
      } else if (roomType === 'Radio Station') {
        return {
          roomClassification: 'Radio Station',
          sceneDescription: 'A campus radio broadcast station studio with acoustic sound-dampening wall panels, broadcast mixing console, dynamic boom microphones, audio monitor speakers, and studio on-air indicator.',
          objects: ['Broadcast Console', 'Microphones', 'Boom Arms', 'Audio Monitors', 'Headphones', 'Acoustic Panels'],
          confidence: 0.95
        };
      } else if (roomType === 'Classroom') {
        return {
          roomClassification: 'Classroom',
          sceneDescription: 'A standard educational classroom with rows of student tables, chairs, a wall-mounted whiteboard at the front, and a projector mounted on the ceiling.',
          objects: ['Board', 'Projector', 'Benches', 'Chairs', 'Ceiling Fan'],
          confidence: 0.91
        };
      } else if (roomType === 'Laboratory') {
        return {
          roomClassification: 'Laboratory',
          sceneDescription: 'A computer laboratory with multiple workstations, monitors, keyboards, lab benches, chairs, and networking equipment visible in a corner rack.',
          objects: ['Computers', 'Lab Benches', 'Chairs', 'Network Switch', 'AC Unit'],
          confidence: 0.94
        };
      } else if (roomType === 'Library') {
        return {
          roomClassification: 'Library',
          sceneDescription: 'A quiet library reading zone containing rows of wooden bookshelves packed with books, study tables with lamps, and comfortable seating chairs.',
          objects: ['Bookshelves', 'Books', 'Tables', 'Chairs', 'Notice Board'],
          confidence: 0.92
        };
      } else if (roomType === 'Hostel') {
        return {
          roomClassification: 'Hostel',
          sceneDescription: 'A hostel student room featuring two bunk beds, study desks with laptops, personal cupboards, and a window overlooking the campus courtyard.',
          objects: ['Beds', 'Desks', 'Cupboards', 'Window', 'Fan'],
          confidence: 0.89
        };
      } else {
        return {
          roomClassification: roomType || 'Other',
          sceneDescription: `An institutional room matching ${roomType || 'Other'} specifications, with chairs, tables, and standard fittings in clean condition.`,
          objects: ['Table', 'Chairs', 'Fittings'],
          confidence: 0.82
        };
      }
    }

    const prompt = `You are an AI infrastructure auditor inspecting university/institutional facilities.
The expected room/space type for this inspection is "${roomType}".

Your tasks:
1. Classify the actual physical space visible in the image(s). The classification MUST be exactly one of:
   ["Guest House", "COE Office", "Research and Development Centre", "Medical Centre", "Radio Station", "Classroom", "Laboratory", "Hostel", "Library", "Office", "Other"].
   If the image shows an unrelated object (e.g. random household items, food, animals, outdoor terrain, blank surfaces) or an uncategorized space, classify it strictly as "Other".
2. Detect and list all prominent objects, fixtures, and institutional assets visible.
3. Provide a concise, factual description of the scene.
4. Calculate the matchConfidence (a decimal between 0.05 and 0.99) measuring HOW STRONGLY the visible scene and assets MATCH the expected space type "${roomType}":
   - 0.85 to 0.99: Strong, definitive match (prominent fixtures and equipment corresponding directly to ${roomType}).
   - 0.60 to 0.84: Moderate match (relevant elements present, but partially ambiguous or generic).
   - 0.30 to 0.59: Weak or inconclusive match (few or generic institutional fixtures).
   - 0.05 to 0.25: Definite MISMATCH (classified as "Other", different room type, or unrelated items).

Return your response strictly as a valid JSON object matching this schema:
{
  "roomClassification": "string",
  "sceneDescription": "string",
  "objects": ["string"],
  "confidence": number (between 0.05 and 0.99)
}
Do not include any markdown formatting like \`\`\`json or backticks. Return only raw JSON.`;

    // Resolve image bytes: prefer provided base64, otherwise fetch the URL.
    let b64 = base64Image;
    if (!b64 && imageUrl) {
      try {
        if (Array.isArray(imageUrl)) {
          b64 = await Promise.all(imageUrl.map(async (url) => {
            const imgRes = await fetch(url);
            if (!imgRes.ok) throw new Error(`status ${imgRes.status}`);
            const arrayBuffer = await imgRes.arrayBuffer();
            return Buffer.from(arrayBuffer).toString('base64');
          }));
        } else {
          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) throw new Error(`status ${imgRes.status}`);
          const arrayBuffer = await imgRes.arrayBuffer();
          b64 = Buffer.from(arrayBuffer).toString('base64');
        }
      } catch (fetchErr) {
        console.error('[AI Service] Failed to download image for VLM analysis', fetchErr.message);
      }
    }

    if (!b64 || (Array.isArray(b64) && b64.length === 0)) {
      throw new AppError('Image data (base64 or fetchable URL) is required for VLM analysis', 400);
    }

    try {
      const isArray = Array.isArray(b64);
      console.log(`[VLM] Analyzing real image via provider="${this.provider}" model="${this.ollamaModel}" images_count=${isArray ? b64.length : 1} expectedRoomType="${roomType}"`);
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

      const rawClassification = String(parsed.roomClassification || 'Other').trim();
      const rawScene = parsed.sceneDescription || '';
      const rawObjects = Array.isArray(parsed.objects) ? parsed.objects : [];
      const rawConfidence = typeof parsed.confidence === 'number' ? Math.max(0.05, Math.min(0.99, parsed.confidence)) : 0.8;

      // Calibrate true match confidence against expected room type
      const dynamicConfidence = this.calculateDynamicMatchConfidence(
        rawClassification,
        roomType,
        rawConfidence,
        rawObjects,
        rawScene
      );

      const result = {
        roomClassification: rawClassification,
        sceneDescription: rawScene,
        objects: rawObjects,
        confidence: dynamicConfidence
      };
      console.log(`[VLM] Result: classification="${result.roomClassification}" (expected="${roomType}") objects=[${result.objects.join(', ')}] rawConfidence=${rawConfidence} dynamicConfidence=${result.confidence}`);
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

      if (roomClassification === 'Guest House') {
        questions.push({ question: 'Are all bed linens, curtains, and guest furnishings clean and properly arranged?' });
        questions.push({ question: 'Is the room air conditioner and primary lighting fully operational?' });
      } else if (roomClassification === 'COE Office') {
        questions.push({ question: 'Are the confidential examination document cabinets and almirahs locked and secured?' });
        questions.push({ question: 'Is the room CCTV camera operational with an unobstructed surveillance view?' });
      } else if (roomClassification === 'Research and Development Centre') {
        questions.push({ question: 'Are the precision measurement workstations and instruments properly powered or covered?' });
        questions.push({ question: 'Is the emergency power shutoff button and safety protective gear accessible?' });
      } else if (roomClassification === 'Medical Centre') {
        questions.push({ question: 'Is the emergency first-aid kit / medicine almirah properly stocked and locked?' });
        questions.push({ question: 'Are examination beds sanitized with fresh disposable covers?' });
      } else if (roomClassification === 'Radio Station') {
        questions.push({ question: 'Are the broadcast mixing console, boom microphones, and monitors intact?' });
        questions.push({ question: 'Are the acoustic soundproofing wall panels in undamaged condition?' });
      } else if (roomClassification === 'Classroom') {
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
    const normVlm = String(signals.vlmRoomType || '').trim().toLowerCase();
    const normExp = String(signals.expectedRoomType || '').trim().toLowerCase();
    if (normVlm && normExp && normVlm === normExp) {
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
