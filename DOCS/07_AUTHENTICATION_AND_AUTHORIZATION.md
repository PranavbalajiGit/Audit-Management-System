# 07_AUTHENTICATION_AND_AUTHORIZATION.md

# Authentication & Authorization

> **Version:** 1.0  
> **Purpose:** Define the authentication, authorization, identity, session, and access-control architecture for the AI-Enabled Smart Infrastructure Audit and Inspection Management System.

---

# 1. Objectives

The authentication system must provide:

- Secure identity verification
- Stateless API authentication
- Role-Based Access Control (RBAC)
- Fine-grained route protection
- Auditability
- Scalability

---

# 2. Security Principles

- Least Privilege
- Zero Trust
- Defense in Depth
- Secure by Default
- Fail Securely

Every protected request must be authenticated and authorized.

---

# 3. User Roles

## Admin

Permissions include:

- Manage users
- Manage buildings
- Manage rooms
- Create checklists
- Assign audits
- View analytics
- Generate reports

## Auditor

Permissions include:

- View assigned audits
- Perform audits
- Submit audits
- View personal history

Future roles can be added without changing authentication logic.

---

# 4. Authentication Flow

```text
User
  │
Login Request
  │
Credential Validation
  │
Password Verification (bcrypt)
  │
JWT Generation
  │
Client Stores Token
  │
Authenticated API Requests
  │
JWT Verification
  │
Authorized Resource
```

---

# 5. Login Process

1. User submits email and password.
2. Validate request payload.
3. Find user by email.
4. Compare password using bcrypt.
5. Verify account status.
6. Generate JWT access token.
7. (Recommended) Generate refresh token.
8. Return authenticated user profile.

---

# 6. JWT Design

Recommended Claims

```json
{
  "sub": "userId",
  "role": "Admin",
  "email": "user@example.com"
}
```

Avoid storing sensitive information inside JWT payloads.

---

# 7. Token Strategy

## Access Token

- Short lifetime
- Sent with every protected request

## Refresh Token (Recommended)

- Longer lifetime
- Used to obtain a new access token
- Revocable

---

# 8. Password Policy

Minimum requirements:

- Minimum 8 characters
- Uppercase letter
- Lowercase letter
- Number
- Special character

Passwords must always be hashed using bcrypt.

Never:

- Store plaintext passwords
- Log passwords
- Return password hashes in responses

---

# 9. Authorization Model

Use Role-Based Access Control.

Example Matrix

| Resource | Admin | Auditor |
|----------|:-----:|:-------:|
| Users | ✓ | ✗ |
| Buildings | ✓ | ✗ |
| Rooms | ✓ | ✗ |
| Assign Audits | ✓ | ✗ |
| Perform Audit | ✗ | ✓ |
| Reports | ✓ | Limited |
| Analytics | ✓ | ✗ |

---

# 10. Route Protection

Example

```text
Public
/login

Protected
/api/v1/*
```

Middleware Order

```text
Request
 │
JWT Verification
 │
Role Verification
 │
Validation
 │
Controller
```

---

# 11. Middleware Responsibilities

Authentication Middleware

- Extract token
- Verify signature
- Validate expiration
- Attach user context

Authorization Middleware

- Check required role
- Reject unauthorized access
- Log security events

---

# 12. Session Management

The backend remains stateless.

Client responsibilities:

- Store access token securely
- Remove tokens on logout
- Refresh expired tokens when supported

---

# 13. Logout

Logout should:

- Remove client token
- Invalidate refresh token (if implemented)
- Log logout event

---

# 14. Error Responses

Examples

401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

403 Forbidden

```json
{
  "success": false,
  "message": "Access denied"
}
```

---

# 15. Security Best Practices

- HTTPS only in production
- Rate-limit login attempts
- Validate all inputs
- Protect secrets using environment variables
- Use secure HTTP headers
- Prevent user enumeration in login responses

---

# 16. Audit Logging

Record:

- Login success
- Login failure
- Logout
- Password change
- Role changes
- Unauthorized access attempts

Store:

- User
- Timestamp
- IP (where available)
- Action
- Result

---

# 17. Future Enhancements

- Multi-factor authentication
- Single Sign-On (SSO)
- OAuth 2.0 / OpenID Connect
- Password reset via email
- Device/session management
- Account lockout policy

---

# 18. Implementation Guidelines

Do:

- Keep authentication logic inside Auth module
- Centralize middleware
- Use environment variables
- Return standardized responses

Do Not:

- Hardcode secrets
- Duplicate authorization checks
- Trust client-provided role values

---

# 19. Related Documents

- README.md
- 02_SYSTEM_ARCHITECTURE.md
- 05_BACKEND_ARCHITECTURE.md
- 08_API_SPECIFICATION.md
- 09_SECURITY_GUIDELINES.md
