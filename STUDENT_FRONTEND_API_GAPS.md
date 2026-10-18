# Student Frontend API Gaps

The Student UI intentionally does not treat empty service stubs or local preview data as authenticated Student records. The DTOs and service files currently in the frontend do not establish the backend response contracts needed for exam assignment, published results, notifications, materials, or an AI viva session.

| Capability | Current frontend evidence | Contract needed before enabling real data |
| --- | --- | --- |
| Assigned exams and schedule | `src/services/exam/examService.ts` returns empty arrays; `Exam` has no schedule/assignment status. | An authenticated, Student-scoped list response containing exam ID, title, subject, scheduled start/end, lecturer display name when allowed, assignment status, and an explicit exam status. The server must derive the Student from authentication rather than trusting a client-supplied Student ID. |
| Exam detail and eligibility | `getExamById` is a TODO stub. | Authorized detail response with instructions and configured duration/rules, plus server-validated eligibility and permitted start window. Do not return restricted question-bank data. |
| Interview room | `src/services/interview/interviewService.ts` methods are TODO stubs. | Authenticated create/resume response with attempt ID/status; question response scoped to that attempt; explicit audio upload and answer-submission contracts; transcript/follow-up responses; and a finish response. The server must enforce timing, ownership, and question limits. |
| Published Student result | `src/services/report/reportService.ts` returns `null` for Student reports. | Student-scoped result response including publication status/time, lecturer-confirmed final score only when published, clearly separate AI suggestions, and only feedback/transcript fields authorized for the Student. Unpublished/private lecturer data must be omitted server-side. |
| Performance overview | No Student report aggregation endpoint is implemented. | A response containing only authorized published scores, dates, and subjects with a documented average calculation. Rankings/percentiles require a separately authorized metric; the frontend must not infer them from an incomplete cohort. |
| Notifications | No notification service or notification DTO exists. | Authenticated list response with notification ID, type, message, timestamp, read state, related destination, plus persistent mark-read operations if supported. |
| Learning materials | No Student materials service or DTO exists. | Authorized list response with stable resource ID, title, type, course/topic association, description/date, and a server-authorized open/download URL or resource operation. |
| Student profile editing | The current session exposes `User` fields; generic user APIs exist, but no Student-editable field policy is represented in the frontend. | A Student self-profile response and an allow-listed update request/response contract. The server must derive identity from authentication and reject role, permission, grade, or other privileged field changes. |
| Student settings | No Student preferences service or DTO exists. | Read/update contracts for each persisted preference, with validation and an explicit saved response. Until then, settings remain read-only. |

Existing endpoint comments such as `/exam`, `/interview/start`, and `/report/student` are TODO notes in the frontend service files; they are not evidence that the backend implements those paths or response schemas. No new network paths are assumed by the Student UI.

Dashboard fixture data is isolated in `src/pages/student/studentDashboardDemoData.ts` and rendered only in Vite development mode with an explicit preview label. Production builds show unavailable/empty states until real Student-scoped APIs are integrated.
