# DEVELOPMENT_ROADMAP.md

# Mary Candyland — Development Roadmap

## Development Strategy
Build in controlled phases. Each phase is planned, implemented, tested, security-reviewed, demonstrated, stabilized and committed before the next phase.

## Phase 0 — Project Preparation
- Git repository
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Firebase project
- Environment variables
- Firebase Authentication
- Firestore
- Storage
- Functions
- Project structure

Deliverable: clean local application safely connected to Firebase.

## Phase 1 — Authentication & Foundation
Build:
- Login/logout
- Password reset
- Authentication state
- Roles
- User profile
- School configuration
- Dashboard
- Navigation
- Protected routes
- Firestore rules
- Storage rules

Test authentication, unauthorized access, roles and school isolation.

## Phase 2 — Users, Students & Classes
Build:
- User management
- Teachers
- Parents
- Students
- Admissions
- Parent-child linking
- Classes
- Subjects
- Teacher assignments
- Student class history

## Phase 3 — Academic Structure
Build:
- Academic years
- Terms
- Current year/term
- Class-subject assignments
- Academic calendar

## Phase 4 — Attendance
Build:
- Teacher attendance interface
- Daily attendance
- Statuses
- Calculations
- History
- Reports
- Parent view

Prevent duplicate attendance and enforce teacher permissions.

## Phase 5 — Assessments & Results
Build:
- Assessments
- Mark entry
- Grading configuration
- Result calculations
- Teacher comments
- Verification
- Report cards
- PDF generation
- Academic history

## Phase 6 — Fees & Finance
Build:
- Fee structures
- Fee items
- Student charges
- Discounts/waivers
- Payments
- Balances
- Receipts
- Financial reports

Financial operations must be auditable and protected.

## Phase 7 — Timetable
Build:
- Periods
- Class timetable
- Teacher timetable
- Student timetable
- Parent timetable
- Conflict detection

## Phase 8 — Communication
Build:
- Announcements
- Targeted announcements
- In-app notifications
- Notification history
- Read/unread status

External SMS/WhatsApp/email integrations come later.

## Phase 9 — Reporting & Search
Build:
- Global student search
- Student reports
- Attendance reports
- Academic reports
- Fee reports
- Payment reports
- Administrative reports
- Exports where appropriate

Use pagination and efficient Firestore queries.

## Phase 10 — Audit & Administration
Build:
- Audit logs
- User activity
- System settings
- School profile
- Grading settings
- Attendance settings
- Fee settings
- Notification settings

## Phase 11 — Security Hardening
Review:
- Authentication
- Firestore rules
- Storage rules
- Functions authorization
- School isolation
- Parent-child isolation
- Teacher authorization
- Financial authorization
- Result authorization
- Sensitive data exposure
- Client-side secrets

Use test accounts to attempt unauthorized access.

## Phase 12 — Performance
Review:
- Firestore reads/writes
- Indexes
- Pagination
- Image sizes
- Bundle size
- Loading speed
- Mobile performance

Avoid unnecessary realtime listeners.

## Phase 13 — Production Readiness
- Production Firebase configuration
- Production security rules
- Domain
- Hosting
- Error monitoring
- Backup/recovery procedures
- Data export strategy
- Admin training
- Teacher training
- Parent onboarding
- Documentation

## Phase 14 — Launch
Launch the stable core:
- Authentication
- Users
- Students
- Parents
- Teachers
- Classes
- Subjects
- Academic years
- Attendance
- Assessments
- Results
- Report cards
- Fees
- Payments
- Receipts
- Timetables
- Announcements

Do not delay launch unnecessarily for future features.

## Future SaaS Expansion
After successful use at Mary Candyland:
- Multiple schools
- Subscription plans
- School onboarding
- Online payments
- SMS
- WhatsApp
- Email
- Payroll
- Inventory
- Library
- Transport
- Biometric attendance
- Online examinations
- Homework
- E-learning
- AI analytics

## AI Coding Workflow
For every feature, instruct the AI to:
1. Inspect existing code.
2. Identify affected modules.
3. Explain the implementation approach.
4. Identify database changes.
5. Identify security implications.
6. Implement.
7. Test.
8. Report files changed.
9. Report database changes.
10. Report security-rule changes.
11. Report tests performed.
12. Wait before starting unrelated work.

## Definition of Done
A phase is complete only when the feature works, data is correct, permissions and Security Rules work, error handling works, mobile and desktop layouts work, existing functionality still works, tests pass and documentation is updated.

## Non-Negotiable Rules
1. No SQL database.
2. Never bypass Firebase Security Rules.
3. Never expose secrets.
4. Never destroy historical records.
5. Never casually modify database architecture.
6. Do not duplicate existing components unnecessarily.
7. Do not build future modules before the current phase is stable.
8. Do not claim completion without testing.
