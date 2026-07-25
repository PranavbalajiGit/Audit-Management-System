# 09_AI_MODULE.md

# AI Module Specification

> **Version:** 1.0  
> **Purpose:** Define the architecture, workflows, interfaces, prompt strategy, confidence engine, and implementation guidelines for the AI subsystem.

---

# 1. Objectives

The AI module is responsible for:

- Verifying that the auditor inspected the correct room
- Understanding captured images
- Generating contextual verification questions
- Validating auditor responses
- Producing a confidence score
- Reducing manual review

---

# 2. AI Components

```text
Frontend
   │
Backend AI Service
   │
├── Image Processing
├── VLM Adapter
├── LLM Adapter
├── Prompt Engine
├── Confidence Engine
└── AI Result Aggregator
```

All provider-specific APIs must be hidden behind adapter interfaces.

---

# 3. AI Pipeline

```text
Capture Images
      │
Upload Images
      │
Pre-processing
      │
Vision Language Model
      │
Scene Analysis
      │
Prompt Builder
      │
Large Language Model
      │
Dynamic Questions
      │
Answer Validation
      │
Confidence Engine
      │
Final Recommendation
```

---

# 4. Vision Language Model (VLM)

## Responsibilities

- Room classification
- Scene understanding
- Object detection
- Asset identification
- Image captioning
- Reference image comparison
- Anomaly detection

### Example Output

```json
{
  "roomType":"Classroom",
  "objects":["Board","Projector","Desk"],
  "sceneSummary":"A classroom with seating and projector.",
  "confidence":0.96
}
```

---

# 5. Large Language Model (LLM)

## Responsibilities

- Generate dynamic questions
- Validate auditor responses
- Explain inconsistencies
- Summarize AI findings

The LLM must never make authorization decisions directly.

---

# 6. Prompt Engineering

Prompts should include:

- Room type
- Checklist
- Detected assets
- Scene summary
- Business rules

Prompt templates must be version-controlled and stored separately from application logic.

---

# 7. Dynamic Question Generation

Questions should be:

- Context-aware
- Non-repetitive
- Relevant to detected assets
- Easy to answer onsite

Example:

- Is the projector functioning?
- How many ceiling fans are visible?
- Are emergency exits obstructed?

---

# 8. Answer Validation

Inputs:

- Auditor answers
- Checklist
- VLM observations

Outputs:

- Match
- Partial match
- Conflict
- Requires review

---

# 9. Confidence Engine

Suggested weighting:

| Signal | Weight |
|--------|-------:|
| QR Verification | 20% |
| GPS Verification | 20% |
| VLM Analysis | 30% |
| Answer Validation | 20% |
| Image Quality | 10% |

Recommendation:

- >= 90 : Auto Approve
- 70–89 : Manual Review
- < 70 : Reject

---

# 10. AI Service Abstraction

```text
AIService
 ├── analyzeImages()
 ├── generateQuestions()
 ├── validateAnswers()
 └── calculateConfidence()
```

Provider adapters:

```text
VLMProvider
LLMProvider
```

This allows changing AI vendors without affecting business logic.

---

# 11. Image Processing

Before VLM analysis:

- Validate file type
- Compress if required
- Remove metadata where appropriate
- Generate thumbnails
- Store in Cloudinary

---

# 12. Failure Handling

Gracefully handle:

- Provider timeout
- Invalid response
- Network failure
- Rate limits
- Low-confidence predictions

Fallback:

- Retry
- Manual review
- Cached prompts where applicable

---

# 13. Security

- Never expose API keys
- Sanitize prompts
- Validate uploaded images
- Limit image size
- Log provider failures
- Defend against prompt injection

---

# 14. Performance

- Async AI processing
- Batch image analysis
- Cache reusable metadata
- Reuse prompt templates
- Queue long-running jobs

---

# 15. Monitoring

Track:

- Response time
- Provider latency
- Token usage
- Confidence distribution
- Failure rate
- Review rate

---

# 16. Testing Strategy

Unit Tests

- Prompt builder
- Confidence engine
- Adapters

Integration Tests

- End-to-end AI pipeline
- Image analysis
- Question generation
- Answer validation

Mock external providers in automated tests.

---

# 17. Future Enhancements

- Multi-image similarity scoring
- Video verification
- OCR extraction
- Speech-to-text observations
- Fine-tuned domain models
- Vector search for historical audits
- Active learning from reviewer feedback

---

# 18. Related Documents

- README.md
- 02_SYSTEM_ARCHITECTURE.md
- 05_BACKEND_ARCHITECTURE.md
- 08_AUDIT_WORKFLOW.md
- 10_API_SPECIFICATION.md
- 11_SECURITY_GUIDELINES.md
