
# 11_PROJECT_STRUCTURE.md

# Project Structure

> **Version:** 1.0  
> **Purpose:** Define the recommended directory structure, module organization, naming conventions, and ownership boundaries for the AI-Enabled Smart Infrastructure Audit and Inspection Management System.

---

# 1. Repository Layout

```text
ai-infrastructure-audit/
│
├── client/                 # React + Vite Frontend
├── server/                 # Express Backend
├── docs/                   # Project Documentation
├── scripts/                # Utility Scripts
├── .github/                # CI/CD Workflows
├── docker/                 # Docker Assets
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 2. Frontend Structure

```text
client/
└── src/
    ├── assets/
    ├── components/
    │   ├── common/
    │   ├── forms/
    │   ├── layout/
    │   └── ui/
    ├── context/
    ├── hooks/
    ├── layouts/
    ├── pages/
    │   ├── admin/
    │   ├── auditor/
    │   └── auth/
    ├── routes/
    ├── services/
    ├── styles/
    ├── utils/
    ├── App.jsx
    └── main.jsx
```

Guidelines:

- Pages contain page-level logic.
- Components remain reusable.
- Services encapsulate API calls.
- Hooks encapsulate reusable behavior.

---

# 3. Backend Structure

```text
server/
└── src/
    ├── config/
    ├── constants/
    ├── middleware/
    ├── modules/
    ├── routes/
    ├── shared/
    ├── utils/
    ├── validators/
    ├── app.js
    └── server.js
```

---

# 4. Module Structure

Every feature module should follow the same layout.

```text
audits/
├── controller/
├── service/
├── repository/
├── model/
├── routes/
├── validation/
├── dto/
├── mapper/
├── constants/
├── helpers/
├── tests/
└── index.js
```

Responsibilities:

- Controller → HTTP layer
- Service → Business logic
- Repository → Database access
- Model → Mongoose schema
- Validation → Request validation
- DTO → Request/response contracts

---

# 5. Shared Components

Shared backend code belongs in:

```text
shared/
├── errors/
├── logger/
├── response/
├── storage/
├── ai/
└── security/
```

Avoid duplicating utilities across modules.

---

# 6. Configuration

```text
config/
├── database.js
├── cloudinary.js
├── jwt.js
├── socket.js
└── ai.js
```

Configuration must only read from environment variables.

---

# 7. Documentation Structure

```text
docs/
├── 01_PROJECT_OVERVIEW.md
├── 02_SYSTEM_ARCHITECTURE.md
├── 03_TECH_STACK.md
├── 04_DATABASE_DESIGN.md
├── 05_BACKEND_ARCHITECTURE.md
├── 06_FRONTEND_ARCHITECTURE.md
├── 07_AUTHENTICATION_AND_AUTHORIZATION.md
├── 08_AUDIT_WORKFLOW.md
├── 09_AI_MODULE.md
├── 10_API_SPECIFICATION.md
└── ...
```

---

# 8. Static Assets

Store static assets separately.

```text
assets/
├── logos/
├── icons/
├── placeholders/
└── illustrations/
```

Uploaded files should **not** be committed to the repository.

---

# 9. Environment Files

```text
.env.example
.env.development
.env.production
```

Never commit production secrets.

---

# 10. Naming Conventions

| Item | Convention |
|------|------------|
| React Components | PascalCase |
| Files | camelCase or kebab-case (consistent) |
| Variables | camelCase |
| Constants | UPPER_SNAKE_CASE |
| Collections | camelCase |
| API Routes | kebab-case |
| Environment Variables | UPPER_SNAKE_CASE |

---

# 11. Import Rules

Preferred import order:

1. External packages
2. Configuration
3. Shared utilities
4. Internal modules
5. Relative imports

Avoid circular dependencies.

---

# 12. Testing Structure

```text
tests/
├── unit/
├── integration/
├── fixtures/
└── mocks/
```

Every module should include automated tests.

---

# 13. Logging & Storage

```text
logs/
uploads/        # Local development only
```

Production media should be stored in Cloudinary.

---

# 14. Build & Deployment

```text
client/dist/
server/build/
```

Generated artifacts must not be edited manually.

---

# 15. Development Principles

- Feature-first organization
- Separation of concerns
- Single Responsibility Principle
- Dependency inversion where practical
- Shared code in shared modules
- No business logic in controllers

---

# 16. Recommended Ownership

| Area | Primary Owner |
|------|---------------|
| Frontend | React Team |
| Backend | API Team |
| AI | AI Team |
| Database | Backend Team |
| Infrastructure | DevOps |
| Documentation | All Contributors |

---

# 17. Scalability Strategy

When the project grows:

- Split AI into its own service.
- Introduce message queues.
- Add Redis caching.
- Containerize services.
- Move toward microservices only when justified.

---

# 18. Related Documents

- README.md
- 02_SYSTEM_ARCHITECTURE.md
- 05_BACKEND_ARCHITECTURE.md
- 06_FRONTEND_ARCHITECTURE.md
- 10_API_SPECIFICATION.md
