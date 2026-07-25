# 06_FRONTEND_ARCHITECTURE.md

# Frontend Architecture

> **Version:** 1.0  
> **Purpose:** Define the frontend architecture, project structure, UI standards, routing strategy, state management, and integration guidelines for the AI-Enabled Smart Infrastructure Audit and Inspection Management System.

---

# 1. Architecture Goals

The frontend must be:

- Modular
- Reusable
- Responsive
- Accessible
- Maintainable
- Performant
- Secure
- API-driven

---

# 2. Technology Stack

| Layer | Technology |
|------|------------|
| Framework | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Routing | React Router |
| Forms | React Hook Form |
| HTTP | Axios |
| Maps | React Leaflet |
| Charts | Recharts |
| PDF | jsPDF |

---

# 3. High-Level Architecture

```text
Browser
   │
React Application
   │
Layouts
   │
Pages
   │
Reusable Components
   │
Hooks / Services
   │
Axios API Client
   │
Express Backend
```

The UI should never communicate directly with external services other than the backend API.

---

# 4. Recommended Folder Structure

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

---

# 5. Feature Organization

## Admin

- Dashboard
- Users
- Buildings
- Rooms
- Categories
- Checklists
- Audit Assignment
- Reports
- Analytics

## Auditor

- Dashboard
- Assigned Audits
- QR Scanner
- GPS Verification
- Camera Capture
- Checklist
- AI Verification
- History

---

# 6. Layout Strategy

Use separate layouts.

```text
PublicLayout

AdminLayout

AuditorLayout

AuthLayout
```

Shared elements:

- Header
- Sidebar
- Breadcrumbs
- Footer

---

# 7. Routing Strategy

```text
/

login

/admin

/admin/users

/admin/buildings

/admin/rooms

/admin/reports

/auditor

/auditor/audits

/auditor/history
```

Protected routes must validate authentication and role before rendering.

---

# 8. Component Design

Reusable components should include:

- Button
- Input
- Select
- Table
- Modal
- Card
- Badge
- Loader
- Empty State
- Pagination
- Toast

Keep components focused on presentation.

---

# 9. State Management

Recommended approach:

- React Context for authentication and global UI state.
- Local component state for page-specific behavior.
- Server data fetched on demand via service layer.

Avoid unnecessary global state.

---

# 10. API Layer

Create a centralized API service.

```text
services/
    api.js
    authService.js
    auditService.js
    roomService.js
    reportService.js
```

Responsibilities:

- Axios instance
- JWT injection
- Error handling
- Request abstraction

---

# 11. Form Strategy

Use React Hook Form.

Validation:

- Required fields
- Length checks
- Pattern validation
- Custom validators

Display inline validation messages.

---

# 12. Camera & GPS

Camera:

- Request permission
- Prefer live capture
- Prevent gallery selection where browser supports camera capture

GPS:

- Request permission
- Capture coordinates
- Display current position on map
- Handle permission denial gracefully

---

# 13. Map Integration

Use React Leaflet with OpenStreetMap.

Capabilities:

- Display registered room location
- Display captured location
- Visualize verification radius

---

# 14. Error Handling

Display user-friendly messages.

Handle:

- Network failures
- Authentication expiry
- Validation errors
- AI processing failures
- Permission denials

Use error boundaries for unexpected UI crashes.

---

# 15. Performance Guidelines

- Lazy-load routes
- Memoize expensive components
- Optimize image rendering
- Paginate large tables
- Avoid unnecessary re-renders
- Debounce search inputs

---

# 16. Accessibility

- Semantic HTML
- Keyboard navigation
- Focus indicators
- ARIA labels where needed
- Sufficient color contrast

---

# 17. UI/UX Standards

- Consistent spacing
- Responsive layouts
- Mobile-friendly forms
- Loading indicators
- Skeleton placeholders
- Confirmation dialogs for destructive actions

---

# 18. Security Considerations

- Do not store secrets in frontend.
- Store access tokens securely.
- Sanitize user input before rendering.
- Hide unauthorized routes.
- Never trust client-side validation alone.

---

# 19. Testing Strategy

Unit:

- Components
- Hooks
- Utility functions

Integration:

- Routing
- Forms
- API interactions

Manual:

- Responsive layouts
- Camera
- GPS
- QR workflow

---

# 20. Coding Standards

- Functional components only
- React Hooks
- PascalCase for components
- camelCase for variables/functions
- One component per file
- Reusable hooks
- Consistent import ordering
- ESLint + Prettier

Avoid:

- Inline business logic
- Duplicate API calls
- Hardcoded URLs
- Deep prop drilling

---

# 21. Related Documents

- README.md
- 02_SYSTEM_ARCHITECTURE.md
- 03_TECH_STACK.md
- 05_BACKEND_ARCHITECTURE.md
- 07_AI_MODULE.md
- 08_API_SPECIFICATION.md
