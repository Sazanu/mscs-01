# DATABASE_SCHEMA.md

# Mary Candyland School Management System — Firestore Schema

## 1. Purpose
This document defines the canonical Cloud Firestore data model.

Firestore is the primary database. Do not introduce SQL or another database without explicit architectural approval.

The schema must support Mary Candyland first while remaining capable of becoming a multi-school SaaS.

## 2. Global Rules

Major school-owned documents should contain:
```text
schoolId
createdAt
updatedAt
createdBy
updatedBy
```

Use Firebase server timestamps where appropriate.

Use Firestore document IDs for internal identifiers. Human-readable identifiers such as admission numbers and receipt numbers are separate fields.

## 3. Top-Level Collections
```text
schools
users
students
parents
teachers
academicYears
terms
classes
subjects
classSubjects
studentClassHistory
attendance
assessments
results
gradingScales
reportCards
feeStructures
studentFees
payments
receipts
timetables
notifications
announcements
documents
auditLogs
settings
```

## 4. schools
`schools/{schoolId}`
```text
name
code
address
city
region
country
phoneNumbers[]
email
website
logoUrl
motto
active
createdAt
updatedAt
```

## 5. users
`users/{userId}`
```text
uid
schoolId
email
phone
displayName
photoUrl
role
active
linkedStudentIds[]
linkedParentId
linkedTeacherId
lastLoginAt
createdAt
updatedAt
```
Roles: `superAdmin`, `admin`, `teacher`, `student`, `parent`.

## 6. students
`students/{studentId}`
```text
schoolId
admissionNumber
firstName
middleName
lastName
fullName
dateOfBirth
gender
nationality
photoUrl
phone
email
address
admissionDate
previousSchool
currentClassId
currentAcademicYearId
status
parentIds[]
emergencyContacts[]
medicalNotes
documents[]
createdAt
updatedAt
createdBy
updatedBy
```
Status: `active`, `inactive`, `graduated`, `transferred`, `withdrawn`.

Do not store the entire academic history in the student document.

## 7. parents
`parents/{parentId}`
```text
schoolId
firstName
lastName
fullName
phone
alternativePhone
email
address
occupation
relationship
photoUrl
studentIds[]
userId
createdAt
updatedAt
```

## 8. teachers
`teachers/{teacherId}`
```text
schoolId
employeeNumber
firstName
lastName
fullName
gender
dateOfBirth
phone
email
address
photoUrl
qualification
specialization
employmentDate
status
userId
createdAt
updatedAt
```

## 9. academicYears
`academicYears/{academicYearId}`
```text
schoolId
name
startDate
endDate
status
isCurrent
createdAt
updatedAt
```

## 10. terms
`terms/{termId}`
```text
schoolId
academicYearId
name
number
startDate
endDate
status
isCurrent
createdAt
updatedAt
```

## 11. classes
`classes/{classId}`
```text
schoolId
name
level
section
academicYearId
classTeacherId
capacity
status
createdAt
updatedAt
```

## 12. subjects
`subjects/{subjectId}`
```text
schoolId
name
code
description
level
active
createdAt
updatedAt
```

## 13. classSubjects
`classSubjects/{classSubjectId}`
```text
schoolId
academicYearId
classId
subjectId
teacherId
coefficient
active
createdAt
updatedAt
```

## 14. studentClassHistory
`studentClassHistory/{historyId}`
```text
schoolId
studentId
classId
academicYearId
startDate
endDate
status
createdAt
```

## 15. attendance
`attendance/{attendanceId}`
```text
schoolId
academicYearId
termId
classId
studentId
date
status
remarks
recordedBy
createdAt
updatedAt
```
Statuses: `present`, `absent`, `late`, `excused`.

Prevent accidental duplicate records for the same student/date/session.

## 16. assessments
`assessments/{assessmentId}`
```text
schoolId
academicYearId
termId
classId
subjectId
teacherId
title
type
maxScore
assessmentDate
description
status
createdAt
updatedAt
```
Types may include `assignment`, `classwork`, `quiz`, `test`, `midterm`, `examination`, `project`, `other`.

## 17. results
`results/{resultId}`
```text
schoolId
academicYearId
termId
classId
studentId
subjectId
assessmentId
score
maxScore
percentage
grade
gradePoint
teacherComment
enteredBy
verifiedBy
status
createdAt
updatedAt
```

Result calculations must be centralized in application/server logic.

## 18. gradingScales
`gradingScales/{gradingScaleId}`
```text
schoolId
name
level
rules[]
active
createdAt
updatedAt
```
Each rule can contain:
```text
minPercentage
maxPercentage
grade
remark
gradePoint
```
The grading system must be configurable.

## 19. reportCards
`reportCards/{reportCardId}`
```text
schoolId
academicYearId
termId
studentId
classId
attendanceSummary
subjectResults[]
overallAverage
position
teacherComment
headteacherComment
promotionStatus
pdfUrl
status
generatedAt
generatedBy
```

## 20. feeStructures
`feeStructures/{feeStructureId}`
```text
schoolId
academicYearId
termId
classId
name
items[]
totalAmount
currency
active
createdAt
updatedAt
```
Each item may contain:
```text
name
description
amount
mandatory
```
GHS is the expected initial currency.

## 21. studentFees
`studentFees/{studentFeeId}`
```text
schoolId
academicYearId
termId
studentId
classId
feeStructureId
charges[]
totalDue
discount
waiver
amountPaid
balance
status
createdAt
updatedAt
```
Status: `unpaid`, `partiallyPaid`, `paid`, `overdue`, `waived`.

## 22. payments
`payments/{paymentId}`
```text
schoolId
studentId
studentFeeId
academicYearId
termId
amount
currency
paymentMethod
reference
description
paymentDate
recordedBy
status
createdAt
updatedAt
```
Methods: `cash`, `mobileMoney`, `bank`, `card`, `other`.

Completed payments must not be freely editable.

## 23. receipts
`receipts/{receiptId}`
```text
schoolId
receiptNumber
paymentId
studentId
amount
currency
paymentMethod
description
issuedAt
issuedBy
pdfUrl
```
Receipt numbers must be unique within the school.

## 24. timetables
`timetables/{timetableId}`
```text
schoolId
academicYearId
classId
dayOfWeek
period
startTime
endTime
subjectId
teacherId
room
active
createdAt
updatedAt
```
Detect obvious class and teacher scheduling conflicts.

## 25. announcements
`announcements/{announcementId}`
```text
schoolId
title
message
audienceType
audienceIds[]
priority
published
publishedAt
expiresAt
createdBy
createdAt
updatedAt
```
Audience examples: `all`, `teachers`, `parents`, `students`, `class`, `specificUsers`.

## 26. notifications
`notifications/{notificationId}`
```text
schoolId
recipientUserId
title
message
type
referenceType
referenceId
read
createdAt
```

## 27. documents
`documents/{documentId}`
```text
schoolId
ownerType
ownerId
fileName
fileUrl
storagePath
fileType
fileSize
category
uploadedBy
createdAt
```

## 28. auditLogs
`auditLogs/{auditLogId}`
```text
schoolId
actorUserId
action
entityType
entityId
description
beforeData
afterData
ipAddress
createdAt
```
Audit logs should be append-oriented and protected from ordinary users.

## 29. settings
`settings/{settingsId}`
Settings may include school profile, grading, attendance, fees, report cards, notifications, academic and system configuration.

## 30. Core Relationships
```text
School
 ├── Users
 ├── Students
 ├── Parents
 ├── Teachers
 ├── Academic Years
 │    └── Terms
 ├── Classes
 │    └── Class Subjects
 │         └── Teachers
 ├── Attendance
 ├── Assessments
 │    └── Results
 ├── Fee Structures
 │    └── Student Fees
 │         └── Payments
 │              └── Receipts
 └── Timetables
```

## 31. Security Rules Principles
1. User must be authenticated.
2. User must belong to the school.
3. User must have the required role.
4. Parent can only access linked children.
5. Student can only access permitted own records.
6. Teacher can only access assigned classes/subjects where applicable.
7. Financial records require appropriate authorization.
8. Audit logs cannot be modified by ordinary users.

Never use `allow read, write: if true;` in production.

## 32. Index Planning
Create indexes based on actual queries. Likely combinations include:
```text
schoolId + academicYearId + termId
schoolId + classId + academicYearId
schoolId + studentId + termId
schoolId + teacherId + academicYearId
schoolId + paymentDate
schoolId + status
```

## 33. Data Integrity
Never delete academic or financial history merely because a student changes class, a new academic year begins, a teacher leaves, or a fee structure changes.

## 34. Schema Change Policy
Any major schema change must be documented, identify affected code and rules, consider migration, and be tested before production.
