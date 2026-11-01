# Project memory

## Product intent & audience

- Education platform with student management, academics, attendance tracking, and reporting features.
- Likely a school/teacher/admin dashboard (classroom management app).

## Brand personality & voice

- Production-grade, polished — user values beautiful, non-cookie-cutter designs.

## Visual design & UX direction

- React + Tailwind CSS with JSX; Lucide React icons for logos/iconography.
- Path alias `@/` maps to `src/` for project module imports (prefer over deep relative paths).
- Sidebar navigation is expected for page access (Attendance and Reports pages exist but aren't yet wired into sidebar).
- No external UI theme/icon packages beyond what the template provides.

## Decisions, constraints & rationale

- **Stack**: Vite + React, Tailwind CSS, Lucide React icons. No other UI/icon packages unless explicitly requested.
- **Backend**: Undecided — Supabase (recommended, pre-provisioned) vs. Firebase (requires user credentials). Decision pending.
- **Conflict noted**: Project roadmap says "No SQL database," but Supabase is SQL-based. This tension is unresolved.
- Core feature areas already identified: sign-in, students, academics, attendance, reports.

## Open questions & assumptions

- Which backend will the user choose: Supabase or Firebase?
- Does the "No SQL database" roadmap constraint still stand? If yes, Supabase may be ruled out.
- Firebase project settings needed if Firebase is chosen.
- No existing memory — context inferred from current exchange only.