# Project memory

## Product intent & audience

- Education platform with student management, academics, attendance tracking, and reporting features.
- School/teacher/admin dashboard (classroom management app).

## Brand personality & voice

- Production-grade, polished — user values beautiful, non-cookie-cutter designs.

## Visual design & UX direction

- React + Tailwind CSS with JSX; Lucide React icons for logos/iconography.
- Path alias `@/` maps to `src/` for project module imports (prefer over deep relative paths).
- Sidebar navigation includes all pages: Students, Academics, Attendance, Reports.
- No external UI theme/icon packages beyond what the template provides.

## Decisions, constraints & rationale

- **Stack**: Vite + React, Tailwind CSS, Lucide React icons. No other UI/icon packages unless explicitly requested.
- **Backend**: Firebase selected. Config provided (projectId `mscs-f6177`, Firestore + Auth + RTDB + Analytics). Initialize Firebase in a central config module.
- Firebase project ID: `mscs-f6177`.
- Firebase services in use: Firestore (primary data), Authentication (sign-in), Analytics.
- Realtime Database URL noted but Firestore is primary data store unless user specifies otherwise.
- "No SQL database" roadmap constraint no longer relevant — user chose Firebase/Firestore.
- Core feature areas: sign-in, students, academics, attendance, reports.
- "Initialize workspace" flow exists to create the school entity after first sign-in.
- Manual Firebase console setup still required: (1) enable Email/Password auth + create admin account, (2) create Firestore database + publish security rules.
- Data pages not yet tested against live Firebase project.

## Open questions & assumptions

- Firebase security rules file exists in project — need user to publish it in Firebase console.
- Should Realtime Database be used for anything, or is Firestore sufficient?
- Are Firestore security rules written and ready to publish?
- Data model structure for students, academics, attendance, and reports in Firestore — not yet documented.
- No testing of data operations against live Firebase yet — issues may surface on first use.