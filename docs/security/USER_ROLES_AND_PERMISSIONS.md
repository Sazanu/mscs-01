# USER_ROLES_AND_PERMISSIONS.md

# Mary Candyland — Roles & Permissions

## 1. Principle
Authorization must be enforced by Firebase Security Rules and server-side logic where appropriate. UI restrictions are not security.

## 2. Roles
```text
superAdmin
admin
teacher
parent
student
```

## 3. Super Admin
Full authority over school settings, administrators, users, academics, students, attendance, assessments, results, fees, payments, receipts, timetables, announcements, reports and audit logs.

## 4. School Administrator
Can manage students, parents, teachers, classes, subjects, academic years, attendance, assessments, results, report cards, fees, payments, receipts, timetables, announcements and reports.

System-level privileges reserved for super admin should not automatically be granted.

## 5. Teacher
Can:
- View own profile
- View assigned classes/students
- Record attendance for assigned classes
- Create assessments for assigned subjects
- Enter marks
- Add comments
- View assigned timetable
- View relevant reports
- Receive notifications

Cannot by default:
- Modify fee structures
- Record payments
- View unrelated students
- Modify another teacher's assessments
- Change school settings
- Manage administrators

## 6. Parent/Guardian
Can access only linked children:
- Own profile
- Children
- Child profile
- Attendance
- Results
- Report cards
- Fee balance
- Payment history
- Receipts
- Timetable
- Announcements
- Notifications

Cannot modify academic, attendance or financial records.

## 7. Student
Can view:
- Own profile
- Own class
- Own timetable
- Own attendance
- Own results
- Own report cards
- Own fee information if enabled
- Announcements
- Notifications

Cannot modify records or access administration.

## 8. Permission Matrix

| Module | Super Admin | Admin | Teacher | Parent | Student |
|---|---|---|---|---|---|
| School Settings | Full | Limited | No | No | No |
| User Management | Full | Manage normal users | No | No | No |
| Students | Full | Full | Assigned | Own children | Self |
| Parents | Full | Full | Limited | Self | No |
| Teachers | Full | Full | Self | No | No |
| Classes | Full | Full | Assigned | Child view | Own |
| Subjects | Full | Full | Assigned | Relevant view | Relevant view |
| Attendance | Full | Full | Assigned | Own children | Self |
| Assessments | Full | Full | Assigned | View | View |
| Results | Full | Full | Assigned | Own children | Self |
| Report Cards | Full | Full | Relevant | Own children | Self |
| Fee Structures | Full | Full | No | View | View if enabled |
| Payments | Full | Full | No | View | View if enabled |
| Receipts | Full | Full | No | Own children | Own |
| Timetable | Full | Full | Assigned | Child | Own |
| Announcements | Full | Full | View | View | View |
| Notifications | Full | Full | Receive | Receive | Receive |
| Reports | Full | Full | Relevant | Own children | Own |
| Audit Logs | Full | Limited | No | No | No |

## 9. School Isolation
Every authenticated user must be associated with a `schoolId`. A user must never read or write another school's records.

## 10. Parent-Child Authorization
Never authorize a parent merely because the browser supplies a `studentId`. Rules/server logic must verify the parent-child relationship.

## 11. Teacher Authorization
Teacher access must be checked against actual class/subject assignments.

## 12. Financial Authorization
Only authorized administrative users may record or modify payments. Completed payments should use an auditable correction/reversal process.

## 13. Result Authorization
Teachers may enter results for assigned subjects/classes. Published or verified results should require appropriate administrative authorization for changes.

## 14. Audit Requirements
Audit significant actions such as user creation, student creation, class changes, result changes, payments, fee changes, report generation and permission changes.

## 15. Security Principle
Never trust the browser. Firestore/Storage Rules and server-side logic must independently enforce authorization.
