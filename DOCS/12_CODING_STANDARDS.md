
# 12_CODING_STANDARDS.md

# Coding Standards

> **Version:** 1.0  
> **Purpose:** Establish consistent coding conventions and best practices across the frontend, backend, and AI modules.

---

# 1. Objectives

The codebase should be:

- Readable
- Consistent
- Modular
- Testable
- Secure
- Maintainable

Every contribution should follow the same conventions.

---

# 2. General Principles

- Follow SOLID principles where appropriate.
- Keep functions small and focused.
- Prefer composition over inheritance.
- Avoid code duplication (DRY).
- Keep solutions simple (KISS).
- Separate business logic from framework code.

---

# 3. Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `AuditCard.jsx` |
| Variables | camelCase | `confidenceScore` |
| Functions | camelCase | `verifyLocation()` |
| Constants | UPPER_SNAKE_CASE | `MAX_IMAGE_SIZE` |
| Files | kebab-case or camelCase (consistent) | `audit-service.js` |
| Environment Variables | UPPER_SNAKE_CASE | `JWT_SECRET` |

---

# 4. Project Structure

- One responsibility per module.
- One React component per file.
- Keep shared utilities in dedicated folders.
- Avoid deeply nested directories.

---

# 5. Backend Guidelines

Controllers:
- Accept requests
- Validate inputs
- Call services
- Return responses

Services:
- Implement business logic
- Coordinate multiple repositories
- Never depend on HTTP objects

Repositories:
- Database access only
- No business rules

---

# 6. Frontend Guidelines

- Prefer functional components.
- Use React Hooks.
- Reuse components before creating new ones.
- Keep presentation separate from API logic.
- Access APIs only through the service layer.

---

# 7. Error Handling

- Throw meaningful errors.
- Use centralized error middleware.
- Never expose stack traces in production.
- Log unexpected exceptions.

---

# 8. API Standards

- RESTful endpoints
- JSON payloads
- Consistent response schema
- Appropriate HTTP status codes

---

# 9. Security Practices

- Validate all inputs.
- Sanitize user-supplied data.
- Never hardcode secrets.
- Hash passwords with bcrypt.
- Protect sensitive routes using JWT and RBAC.

---

# 10. AI Module Standards

- Isolate AI providers behind adapters.
- Keep prompts version-controlled.
- Do not embed prompts in controllers.
- Retry transient provider failures safely.

---

# 11. Logging

Log:

- Authentication events
- Audit lifecycle
- AI requests
- Errors
- Security events

Prefer structured JSON logs.

---

# 12. Documentation

- Comment *why*, not *what*.
- Public functions should include concise documentation.
- Keep README and docs synchronized with implementation.

---

# 13. Git Workflow

- Use feature branches.
- Keep commits focused.
- Write meaningful commit messages.

Example:

```text
feat: add GPS verification service
fix: handle invalid QR response
docs: update API specification
```

---

# 14. Code Review Checklist

- Naming is consistent
- No duplicated logic
- Validation present
- Error handling implemented
- Tests updated
- Documentation updated
- No secrets committed

---

# 15. Formatting

Use:

- ESLint
- Prettier

Avoid manual formatting differences.

---

# 16. Anti-Patterns

Do not:

- Create fat controllers
- Duplicate database queries
- Mix UI with business logic
- Hardcode URLs or secrets
- Ignore rejected promises
- Suppress errors silently

---

# 17. Related Documents

- 05_BACKEND_ARCHITECTURE.md
- 06_FRONTEND_ARCHITECTURE.md
- 10_API_SPECIFICATION.md
- 11_PROJECT_STRUCTURE.md
- 13_SECURITY_GUIDELINES.md
