# 02_SYSTEM_ARCHITECTURE.md

# System Architecture

> **Version:** 1.0  
> **Purpose:** Define the logical, physical, and software architecture of the AI-Enabled Smart Infrastructure Audit and Inspection Management System.

---

# 1. Architecture Goals

The system is designed to be:

- Modular
- Scalable
- Secure
- Maintainable
- AI-ready
- Cloud-native
- Production-grade

The architecture separates concerns so each layer can evolve independently.

---

# 2. High-Level Architecture

```text
                    +----------------------+
                    |   React Frontend     |
                    +----------+-----------+
                               |
                         HTTPS / REST
                               |
                    +----------v-----------+
                    | Express API Server   |
                    +----------+-----------+
                               |
     +-------------------------+--------------------------+
     |            Business Modules                        |
     |----------------------------------------------------|
     | Auth | Users | Audits | QR | GPS | AI | Reports    |
     | Buildings | Rooms | Analytics | Notifications      |
     +-------------------------+--------------------------+
                               |
                     Repository Layer
                               |
                        MongoDB Atlas
                               |
      +------------------------+------------------------+
      | Cloudinary | VLM | LLM | Socket.IO | Maps API   |
      +-----------------------------------------------+
```

---

# 3. Architectural Style

This project follows a **Modular Monolith** with **Layered Architecture**.

Why?

- Easier development than microservices.
- Strong module boundaries.
- Simple deployment.
- Easier testing.
- Can later migrate modules into microservices.

---

# 4. Backend Layered Architecture

```text
HTTP Request
      │
      ▼
Routes
      │
      ▼
Controller
      │
      ▼
Service
      │
      ▼
Repository
      │
      ▼
MongoDB
```

### Responsibilities

**Routes**
- Endpoint registration
- Middleware binding

**Controller**
- Request parsing
- Response formatting
- Status codes

**Service**
- Business logic
- AI orchestration
- Validation coordination

**Repository**
- Database operations only

**Model**
- Mongoose schema definitions

---

# 5. Module Architecture

Each feature is isolated into a module.

```text
modules/

auth/
users/
audits/
buildings/
rooms/
checklists/
assignments/
qr/
gps/
ai/
reports/
analytics/
notifications/
```

Every module contains:

```text
controller/
service/
repository/
model/
routes/
validation/
dto/
```

---

# 6. Frontend Architecture

```text
src/

components/
pages/
layouts/
hooks/
services/
context/
utils/
assets/
routes/
```

### Principles

- Reusable UI
- Route protection
- API abstraction
- Form validation
- Feature-based organization

---

# 7. AI Architecture

```text
Live Image
      │
      ▼
Cloudinary Upload
      │
      ▼
Vision Language Model
      │
      ├── Room Classification
      ├── Scene Understanding
      ├── Object Detection
      └── Asset Identification
      │
      ▼
Scene Description
      │
      ▼
Large Language Model
      │
      ├── Dynamic Questions
      ├── Answer Validation
      └── Context Analysis
      │
      ▼
Confidence Engine
      │
      ▼
Decision
```

AI providers must be abstracted behind services to allow future replacement.

---

# 8. Verification Pipeline

```text
Login
  │
Assigned Audit
  │
QR Verification
  │
GPS Verification
  │
Camera Capture
  │
VLM Analysis
  │
Scene Description
  │
LLM Questions
  │
Auditor Answers
  │
Checklist Validation
  │
Confidence Score
  │
Approve / Manual Review
```

Each stage returns an independent verification result.

---

# 9. Request Flow

```text
Client
   │
HTTP Request
   │
Route
   │
Authentication Middleware
   │
Authorization Middleware
   │
Controller
   │
Service
   │
Repository
   │
MongoDB
   │
Response
```

---

# 10. Authentication Flow

```text
Login
   │
Credential Validation
   │
Password Verification
   │
JWT Generation
   │
Client Stores Token
   │
Authenticated Requests
   │
JWT Verification
   │
Role Validation
   │
Protected Resource
```

---

# 11. Data Flow

Audit Submission

```text
Auditor
   │
QR Scan
   │
GPS
   │
Image
   │
Checklist
   │
AI Services
   │
Confidence Engine
   │
MongoDB
   │
Dashboard
```

---

# 12. Component Interaction

```text
Frontend
    │
Express API
    │
──────────────────────────────
Auth Module
Audit Module
QR Module
GPS Module
AI Module
Report Module
Analytics Module
──────────────────────────────
    │
MongoDB
Cloudinary
AI Models
Socket.IO
```

---

# 13. External Integrations

| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Database |
| Cloudinary | Image Storage |
| Vision Language Model | Image Analysis |
| Large Language Model | Question Generation |
| OpenStreetMap | Maps |
| Browser Geolocation API | GPS |
| Socket.IO | Real-time Updates |

---

# 14. Deployment Architecture

```text
User
 │
 ▼
Vercel (React)
 │
HTTPS
 │
Render (Express)
 │
MongoDB Atlas
 │
Cloudinary
 │
AI Provider APIs
```

---

# 15. Scalability Strategy

- Modular feature isolation
- Repository pattern
- Stateless backend
- Environment-based configuration
- Replaceable AI providers
- Cloud-hosted database
- Horizontal API scaling

---

# 16. Security Architecture

Security layers include:

- JWT Authentication
- RBAC
- Helmet
- CORS
- Rate Limiting
- Input Validation
- Password Hashing
- Secure Environment Variables
- Centralized Error Handling

---

# 17. Logging & Monitoring

Log:

- Authentication
- Audit creation
- Audit submission
- AI verification
- Errors
- Security events

Recommended production stack:

- Pino
- Morgan (development)
- Render logs
- MongoDB Atlas monitoring

---

# 18. Architectural Decisions

| Decision | Reason |
|----------|--------|
| Modular Monolith | Simpler development with clear boundaries |
| Layered Architecture | Separation of concerns |
| MongoDB | Flexible schema for dynamic checklists |
| Cloudinary | Managed media storage |
| React + Vite | Fast development and performance |
| Express.js | Lightweight REST API |
| JWT | Stateless authentication |
| Socket.IO | Real-time updates |
| AI Service Abstraction | Vendor independence |

---

# 19. Future Evolution

Potential migration path:

```text
Current
Modular Monolith

        │

Future

Auth Service
Audit Service
AI Service
Notification Service
Analytics Service
```

No business logic changes should be required if services are extracted later.

---

# 20. Related Documents

- README.md
- 01_PROJECT_OVERVIEW.md
- 03_TECH_STACK.md
- 04_DATABASE_DESIGN.md
- 05_BACKEND_GUIDELINES.md
- 06_FRONTEND_GUIDELINES.md
- 07_AI_MODULE.md
- 08_API_SPECIFICATION.md
- 09_SECURITY_GUIDELINES.md
- 10_CODING_STANDARDS.md
