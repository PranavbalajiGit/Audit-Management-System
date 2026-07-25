# 10_API_SPECIFICATION.md

# API Specification

> **Version:** 1.0  
> **Base URL:** `/api/v1`  
> **Purpose:** Define the REST API contract for the AI-Enabled Smart Infrastructure Audit and Inspection Management System.

---

# 1. API Principles

- RESTful resource-oriented endpoints
- JSON request/response format
- Stateless authentication using JWT
- Consistent error handling
- Versioned APIs
- Idempotent GET/PUT/DELETE operations

---

# 2. Authentication

Protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 3. Standard Response Format

## Success

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# 4. Authentication APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| POST | /auth/logout | Logout |
| GET | /auth/profile | Current user |

---

# 5. User APIs

| Method | Endpoint |
|--------|----------|
| GET | /users |
| GET | /users/:id |
| POST | /users |
| PATCH | /users/:id |
| DELETE | /users/:id |

Admin only.

---

# 6. Building APIs

| Method | Endpoint |
|--------|----------|
| GET | /buildings |
| GET | /buildings/:id |
| POST | /buildings |
| PATCH | /buildings/:id |
| DELETE | /buildings/:id |

---

# 7. Room APIs

| Method | Endpoint |
|--------|----------|
| GET | /rooms |
| GET | /rooms/:id |
| POST | /rooms |
| PATCH | /rooms/:id |
| DELETE | /rooms/:id |

---

# 8. Checklist APIs

| Method | Endpoint |
|--------|----------|
| GET | /checklists |
| POST | /checklists |
| PATCH | /checklists/:id |
| DELETE | /checklists/:id |

---

# 9. Audit Assignment APIs

| Method | Endpoint |
|--------|----------|
| POST | /audit-assignments |
| GET | /audit-assignments |
| PATCH | /audit-assignments/:id |

---

# 10. Audit APIs

| Method | Endpoint |
|--------|----------|
| GET | /audits |
| GET | /audits/:id |
| POST | /audits/start |
| POST | /audits/:id/submit |
| PATCH | /audits/:id/status |

---

# 11. QR Verification APIs

| Method | Endpoint |
|--------|----------|
| POST | /qr/verify |
| POST | /qr/generate |

---

# 12. GPS Verification APIs

| Method | Endpoint |
|--------|----------|
| POST | /gps/verify |

Sample Request

```json
{
  "auditId":"...",
  "latitude":11.01,
  "longitude":76.98,
  "accuracy":8
}
```

---

# 13. Image Upload APIs

| Method | Endpoint |
|--------|----------|
| POST | /images/upload |
| DELETE | /images/:id |

Multipart form-data recommended.

---

# 14. AI APIs

| Method | Endpoint |
|--------|----------|
| POST | /ai/analyze |
| POST | /ai/questions |
| POST | /ai/validate |
| GET | /ai/results/:auditId |

---

# 15. Report APIs

| Method | Endpoint |
|--------|----------|
| GET | /reports |
| GET | /reports/:id |
| POST | /reports/generate |

---

# 16. Analytics APIs

| Method | Endpoint |
|--------|----------|
| GET | /analytics/dashboard |
| GET | /analytics/trends |
| GET | /analytics/auditors |

---

# 17. Status Codes

| Code | Meaning |
|------|---------|
|200|OK|
|201|Created|
|400|Bad Request|
|401|Unauthorized|
|403|Forbidden|
|404|Not Found|
|409|Conflict|
|422|Validation Error|
|429|Too Many Requests|
|500|Internal Server Error|

---

# 18. Pagination

Query Parameters

```text
?page=1
&limit=20
&sort=createdAt
&order=desc
```

Response

```json
{
  "data":[],
  "pagination":{
    "page":1,
    "limit":20,
    "total":120
  }
}
```

---

# 19. Filtering

Examples

```text
GET /audits?status=Approved
GET /rooms?buildingId=123
GET /users?role=Auditor
```

---

# 20. Validation Rules

- Validate body, params, and query
- Reject unknown fields where practical
- Return field-level validation errors

---

# 21. API Security

- JWT authentication
- RBAC authorization
- HTTPS in production
- Rate limiting
- Request size limits
- File type validation
- CORS configuration

---

# 22. Versioning

Current:

```text
/api/v1
```

Future versions:

```text
/api/v2
```

Do not introduce breaking changes within a version.

---

# 23. Error Model

Example

```json
{
  "success":false,
  "message":"Invalid QR code",
  "errors":[
    {
      "field":"qr",
      "code":"QR_INVALID"
    }
  ]
}
```

---

# 24. OpenAPI Recommendations

Maintain an OpenAPI 3.x specification with:

- Schemas
- Security definitions
- Request examples
- Response examples

---

# 25. Related Documents

- README.md
- 05_BACKEND_ARCHITECTURE.md
- 07_AUTHENTICATION_AND_AUTHORIZATION.md
- 08_AUDIT_WORKFLOW.md
- 09_AI_MODULE.md
- 11_SECURITY_GUIDELINES.md
