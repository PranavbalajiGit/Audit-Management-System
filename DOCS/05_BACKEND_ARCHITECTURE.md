# 05_BACKEND_ARCHITECTURE.md

# Backend Architecture

> **Version:** 1.0
> **Purpose:** Define the backend architecture, design principles, coding standards, module organization, request lifecycle, and implementation guidelines.

---

# 1. Objectives

The backend shall be:

- Modular
- Secure
- Testable
- Scalable
- Maintainable
- Cloud-ready
- AI-provider independent

---

# 2. Technology Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcrypt
- Socket.IO
- Cloudinary
- Vision Language Model
- Large Language Model

---

# 3. Architectural Pattern

The backend follows a **Layered Modular Monolith**.

```text
Client
  │
Routes
  │
Middleware
  │
Controller
  │
Service
  │
Repository
  │
MongoDB
```

Business logic must exist only inside the Service layer.

---

# 4. Recommended Folder Structure

```text
server/
└── src/
    ├── config/
    ├── constants/
    ├── middleware/
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── audits/
    │   ├── buildings/
    │   ├── rooms/
    │   ├── qr/
    │   ├── gps/
    │   ├── ai/
    │   ├── reports/
    │   └── analytics/
    ├── routes/
    ├── services/
    ├── utils/
    ├── validators/
    ├── app.js
    └── server.js
```

Each module:

```text
module/
├── controller/
├── service/
├── repository/
├── model/
├── routes/
├── validation/
├── dto/
└── tests/
```

---

# 5. Request Lifecycle

```text
HTTP Request
   │
Express Route
   │
Authentication
   │
Authorization
   │
Validation
   │
Controller
   │
Service
   │
Repository
   │
MongoDB
   │
Response Formatter
```

---

# 6. Layer Responsibilities

## Routes

- Register endpoints
- Attach middleware
- No business logic

## Middleware

- Authentication
- Authorization
- Validation
- Logging
- Error propagation

## Controllers

- Parse requests
- Invoke services
- Return standardized responses

## Services

- Business rules
- AI orchestration
- Transactions
- Cross-module coordination

## Repositories

- CRUD
- Aggregation
- Database queries

## Models

- Mongoose schemas
- Indexes
- Hooks

---

# 7. Module Responsibilities

## Auth

- Login
- Refresh token
- Logout

## Users

- User CRUD
- Role assignment

## Buildings

- Building management

## Rooms

- Room management
- GPS coordinates
- Reference images

## Audits

- Assignment
- Submission
- Status

## QR

- Generation
- Validation

## GPS

- Capture
- Verification

## AI

- Image analysis
- Question generation
- Confidence scoring

## Reports

- PDF generation
- Export

## Analytics

- Dashboard metrics

---

# 8. API Design Standards

Base URL

```text
/api/v1
```

Example

```text
GET    /api/v1/audits
POST   /api/v1/audits
PATCH  /api/v1/audits/:id
DELETE /api/v1/audits/:id
```

Use nouns, not verbs.

---

# 9. Response Format

Success

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# 10. Validation Strategy

Validate:

- Body
- Params
- Query
- Headers

Reject invalid requests before controller execution.

---

# 11. Authentication & Authorization

Authentication

- JWT access token
- Refresh token (recommended)

Authorization

- Role Based Access Control

Roles

- Admin
- Auditor

Protect every private route.

---

# 12. Error Handling

Use a centralized error middleware.

Categories:

- Validation
- Authentication
- Authorization
- Database
- AI provider
- External services

Never expose stack traces in production.

---

# 13. Logging

Log:

- Login
- Logout
- Audit events
- AI requests
- Security events
- Errors

Prefer structured JSON logs.

---

# 14. Configuration

Keep configuration in `config/`.

Use environment variables for:

- Database
- JWT
- Cloudinary
- AI providers
- Client URL
- Confidence thresholds

---

# 15. AI Integration Pattern

```text
Controller
   │
AI Service
   │
Provider Adapter
   │
External Model
```

Controllers must never call external AI APIs directly.

---

# 16. Security Checklist

- Helmet
- CORS
- Rate limiting
- Input sanitization
- Password hashing
- Secure cookies if refresh tokens are used
- File validation
- Environment secrets

---

# 17. Performance Guidelines

- Pagination
- Projection
- Database indexes
- Async operations
- Avoid N+1 queries
- Cache static metadata when appropriate

---

# 18. Testing Strategy

Unit Tests

- Services
- Utilities
- Validators

Integration Tests

- Routes
- Authentication
- Audit workflow

Mock external AI providers.

---

# 19. Coding Standards

- Async/await only
- No callback-based code
- Small functions
- Dependency inversion where practical
- Reusable utilities
- Consistent naming
- ESLint + Prettier

Avoid:

- Fat controllers
- Duplicate queries
- Hardcoded values
- Circular dependencies

---

# 20. Architecture Decisions

| Decision | Reason |
|----------|--------|
| Layered Architecture | Separation of concerns |
| Repository Pattern | Easier testing |
| Modular Monolith | Simpler deployment |
| AI Adapter Layer | Vendor independence |
| JWT | Stateless authentication |

---

# 21. Related Documents

- README.md
- 02_SYSTEM_ARCHITECTURE.md
- 04_DATABASE_DESIGN.md
- 06_FRONTEND_ARCHITECTURE.md
- 08_API_SPECIFICATION.md
- 09_SECURITY_GUIDELINES.md
