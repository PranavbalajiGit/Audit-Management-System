# 03_TECH_STACK.md

# Technology Stack

> **Version:** 1.0  
> **Purpose:** Define the approved technology stack, the rationale behind each technology choice, alternatives considered, and engineering guidelines.

---

# 1. Technology Selection Philosophy

The stack has been selected based on the following principles:

- Open-source first
- Production readiness
- Strong community support
- Long-term maintainability
- Scalability
- Cloud compatibility
- Ease of integration with AI services

---

# 2. Technology Overview

| Layer | Technology |
|--------|------------|
| Frontend | React + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Routing | React Router |
| Forms | React Hook Form |
| HTTP Client | Axios |
| Maps | React Leaflet + OpenStreetMap |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Authentication | JWT + bcrypt |
| Realtime | Socket.IO |
| Media Storage | Cloudinary |
| AI | Vision Language Model + Large Language Model |
| Charts | Recharts |
| Reports | jsPDF |
| Version Control | Git + GitHub |
| Deployment | Vercel + Render |

---

# 3. Frontend Stack

## React

### Purpose
Build a component-based Single Page Application.

### Why React?

- Industry standard
- Large ecosystem
- Reusable components
- Excellent AI tooling support
- Easy state management

### Alternatives Considered

- Angular
- Vue

### Decision

React offers the best balance of ecosystem maturity and flexibility.

---

## Vite

### Purpose

Development server and build tool.

### Why?

- Extremely fast startup
- Instant Hot Module Replacement
- Optimized production builds
- Minimal configuration

### Alternatives

- Create React App
- Webpack

### Decision

Vite is the modern default for React applications.

---

## Tailwind CSS

### Purpose

Utility-first styling.

### Benefits

- Rapid UI development
- Consistent design
- Small production CSS
- Highly customizable

---

## shadcn/ui

### Purpose

Accessible, reusable UI components.

### Benefits

- Copy-and-own component model
- Tailwind native
- Easy customization
- Excellent developer experience

---

## React Router

Purpose:

- Client-side routing
- Protected routes
- Nested layouts

---

## Axios

Purpose:

- API communication
- Centralized interceptors
- JWT token injection
- Error handling

---

## React Hook Form

Purpose:

- Efficient form handling
- Validation
- Reduced re-renders

---

## React Leaflet

Purpose:

- Interactive maps
- Display room locations
- GPS visualization

---

# 4. Backend Stack

## Node.js

Purpose:

JavaScript runtime for backend services.

Benefits:

- Event-driven
- Non-blocking I/O
- Large ecosystem
- Shared language with frontend

---

## Express.js

Purpose:

REST API framework.

Responsibilities:

- Routing
- Middleware
- API endpoints
- Error handling

Decision:

Lightweight, mature, and easy to structure into layered architecture.

---

# 5. Database

## MongoDB Atlas

Purpose

Primary cloud-hosted NoSQL database.

Why MongoDB?

- Flexible schema
- Dynamic documents
- Easy horizontal scaling
- Managed cloud service

Suitable Collections

- Users
- Audits
- Rooms
- Checklists
- AI Analysis
- Reports

---

## Mongoose

Purpose

Object Data Modeling (ODM)

Responsibilities

- Schema definition
- Validation
- Relationships
- Middleware
- Query abstraction

---

# 6. Authentication

## JWT

Purpose

Stateless authentication.

Advantages

- Scalable
- Easy API protection
- Supports RBAC

Best Practices

- Short-lived access tokens
- Refresh tokens
- Secure storage
- HTTPS only in production

---

## bcrypt

Purpose

Password hashing.

Reason

Never store plain-text passwords.

---

# 7. AI Stack

## Vision Language Model (VLM)

Responsibilities

- Room classification
- Scene understanding
- Object detection
- Asset identification
- Scene description

Design Guideline

The application must depend on an abstraction layer, not a specific vendor API.

---

## Large Language Model (LLM)

Responsibilities

- Dynamic question generation
- Answer evaluation
- Reasoning support

Design Guideline

Prompts should be version-controlled and isolated from business logic.

---

# 8. Media Storage

## Cloudinary

Purpose

Store audit images and reference images.

Benefits

- CDN delivery
- Image optimization
- Secure uploads
- Scalable storage

Alternatives

- AWS S3
- Firebase Storage

Decision

Cloudinary provides a generous free tier and built-in image processing.

---

# 9. Maps & Geolocation

## OpenStreetMap

Purpose

Base map provider.

Reason

Free and open-source.

---

## Browser Geolocation API

Purpose

Capture live device location.

Important Note

Server-side validation must compare captured coordinates against registered room coordinates within a configurable tolerance.

---

# 10. Realtime Communication

## Socket.IO

Use Cases

- Live auditor tracking
- Dashboard updates
- Notifications
- Status synchronization

---

# 11. Charts & Reporting

## Recharts

Purpose

Interactive dashboards.

Reasons

- React-native API
- Responsive charts
- Easy customization

---

## jsPDF

Purpose

Generate downloadable audit reports.

---

# 12. Deployment

## Frontend

Platform

Vercel

Reason

Optimized for React and simple CI/CD.

---

## Backend

Platform

Render

Reason

Managed Node.js hosting with straightforward deployment.

---

## Database

MongoDB Atlas

Managed cloud database.

---

# 13. Development Tools

| Tool | Purpose |
|------|---------|
| Git | Version control |
| GitHub | Repository hosting |
| VS Code | IDE |
| Postman / Bruno | API testing |
| ESLint | Code quality |
| Prettier | Code formatting |
| Nodemon | Local backend development |

---

# 14. Environment Variables

Environment variables must store:

- Database URI
- JWT secrets
- Cloudinary credentials
- AI API keys
- Frontend URL
- Backend URL
- Confidence thresholds

Never commit `.env` files to version control.

---

# 15. Technology Trade-offs

| Decision | Alternatives | Why Selected |
|----------|--------------|--------------|
| React | Angular, Vue | Ecosystem and flexibility |
| Vite | CRA | Faster builds |
| Express | NestJS, Fastify | Simplicity and modularity |
| MongoDB | PostgreSQL | Flexible schema |
| Cloudinary | S3 | Easier setup |
| OpenStreetMap | Google Maps | Free and open-source |
| JWT | Server sessions | Stateless APIs |

---

# 16. AI Agent Implementation Notes

- Do not hardcode provider-specific APIs into controllers.
- Keep all external services behind service interfaces.
- Avoid business logic inside routes.
- Prefer dependency injection where practical.
- Write reusable modules and avoid duplication.

---

# 17. Future Upgrade Path

Potential future upgrades:

- Redis caching
- Message queues (RabbitMQ/Kafka)
- Kubernetes
- CI/CD pipelines
- OpenTelemetry
- Vector databases for AI retrieval
- Dedicated AI microservice

---

# 18. Related Documents

- README.md
- 01_PROJECT_OVERVIEW.md
- 02_SYSTEM_ARCHITECTURE.md
- 04_DATABASE_DESIGN.md
- 05_BACKEND_GUIDELINES.md
- 07_AI_MODULE.md
- 08_API_SPECIFICATION.md
- 09_SECURITY_GUIDELINES.md
