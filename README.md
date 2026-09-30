````markdown
# SWD392_GROUP_5_FA_26_SE1929 - Frontend

Nơi những anh tài hội tụ

## 1. Giới thiệu

Frontend của hệ thống thi vấn đáp hỗ trợ AI.

Frontend cung cấp giao diện cho các role:

- Admin
- Lecturer
- Student

Frontend giao tiếp với Backend thông qua REST API.

---

# 2. Chức năng chính

## Admin

- Đăng nhập.
- Quản lý tài khoản.
- Quản lý role và quyền.
- Quản lý cấu hình hệ thống.
- Quản lý phân quyền môn học.

## Lecturer

- Quản lý ngân hàng câu hỏi.
- Tạo, chỉnh sửa, xóa câu hỏi.
- Import câu hỏi.
- Tạo câu hỏi bằng AI.
- Quản lý rubric.
- Tạo và quản lý kỳ thi.
- Quản lý lịch thi.
- Theo dõi phiên thi.
- Xem transcript và kết quả AI đánh giá.
- Điều chỉnh và xác nhận điểm cuối cùng.
- Xem thống kê lớp.
- Xuất bảng điểm.

## Student

- Đăng nhập.
- Xem lịch thi.
- Tham gia kỳ thi.
- Nghe câu hỏi từ AI.
- Trả lời bằng giọng nói.
- Theo dõi câu hỏi follow-up.
- Hoàn thành bài thi.
- Xem kết quả và báo cáo sau kỳ thi.

---

# 3. Công nghệ

Frontend sử dụng:

```text
React
Vite
JavaScript / TypeScript
React Router
Axios
````

Các thư viện UI hoặc CSS framework có thể được bổ sung tùy theo quá trình phát triển giao diện.

---

# 4. Cấu trúc thư mục

```text
src/
├── assets/
├── components/
├── pages/
├── layouts/
├── routes/
├── services/
├── hooks/
├── context/
├── utils/
├── constants/
├── types/
├── App.jsx
└── main.jsx
```

## Các thư mục chính

### components/

Chứa các component UI có thể tái sử dụng.

Ví dụ:

```text
Button
Modal
Table
Input
Pagination
QuestionCard
```

### pages/

Chứa các trang của hệ thống.

Ví dụ:

```text
Login
Dashboard
QuestionBank
ExamManagement
ExamSchedule
Interview
Evaluation
Report
UserManagement
```

### layouts/

Chứa layout dùng chung cho từng nhóm người dùng.

Ví dụ:

```text
AdminLayout
LecturerLayout
StudentLayout
```

### services/

Chứa các service dùng để giao tiếp với Backend API.

Ví dụ:

```text
authService
questionService
examService
interviewService
evaluationService
reportService
userService
```

### routes/

Quản lý routing và bảo vệ route theo role.

Ví dụ:

```text
/admin/*
/lecturer/*
/student/*
```

### hooks/

Chứa các custom React hooks dùng chung.

### context/

Quản lý các state dùng chung như authentication và user information.

### utils/

Chứa các hàm tiện ích dùng chung.

---

# 5. Luồng Frontend

```text
User
  |
  v
Login
  |
  v
Authentication
  |
  v
Role Detection
  |
  +---- Admin Dashboard
  |
  +---- Lecturer Dashboard
  |
  +---- Student Dashboard
```

Frontend gọi Backend thông qua API:

```text
Frontend
    |
    | HTTP Request
    v
Spring Boot Backend
    |
    v
Database / AI Services
    |
    v
HTTP Response
    |
    v
Frontend
```

---

# 6. API Integration

Tất cả API request được quản lý tập trung trong `services`.

Ví dụ:

```text
services/
├── authService.js
├── userService.js
├── questionService.js
├── examService.js
├── interviewService.js
├── evaluationService.js
└── reportService.js
```

Không gọi API trực tiếp trong UI component nếu không cần thiết.

Luồng:

```text
Page
  |
  v
Service
  |
  v
Backend API
  |
  v
Response
  |
  v
Page / Component
```

---

# 7. Authentication

Frontend sử dụng JWT do Backend cung cấp.

Luồng đăng nhập:

```text
Login Page
    |
    v
POST /api/auth/login
    |
    v
Backend
    |
    v
JWT
    |
    v
Frontend
    |
    v
Authenticated User
```

Frontend cần xử lý:

* Login.
* Logout.
* Lưu authentication state.
* Gửi JWT trong API request.
* Kiểm tra quyền truy cập.
* Redirect khi token hết hạn hoặc không có quyền.

---

# 8. Role-based Routing

Các route được phân quyền theo role:

```text
ADMIN
    -> /admin/*

LECTURER
    -> /lecturer/*

STUDENT
    -> /student/*
```

Người dùng không có quyền không được truy cập các trang tương ứng.

---

# 9. Các nhóm giao diện chính

```text
Authentication
    |
    +-- Login

Admin
    |
    +-- Dashboard
    +-- User Management
    +-- System Configuration

Lecturer
    |
    +-- Dashboard
    +-- Question Bank
    +-- Rubric Management
    +-- Exam Management
    +-- Exam Schedule
    +-- Evaluation
    +-- Reports
    +-- Statistics

Student
    |
    +-- Dashboard
    +-- Exam Schedule
    +-- AI Interview
    +-- Exam Result
    +-- Report
```

---

# 10. AI Interview UI

Trang AI Interview là giao diện chính của quá trình thi vấn đáp.

Luồng giao diện:

```text
Start Exam
    |
    v
Display Question
    |
    v
AI Voice
    |
    v
Student Answers
    |
    v
Speech-to-Text
    |
    v
Display Transcript
    |
    v
AI Analysis
    |
    +---- Normal Answer ----> Next Question
    |
    +---- Need Follow-up --> Follow-up Question
```

Frontend chịu trách nhiệm hiển thị trạng thái của phiên phỏng vấn, câu hỏi, transcript, thời gian và các thông tin cần thiết cho sinh viên.

---

# 11. Quy tắc phát triển Frontend

* Component phải có trách nhiệm rõ ràng.
* Ưu tiên tái sử dụng component.
* Không viết API call trực tiếp trong nhiều component khác nhau.
* Không hard-code API key hoặc thông tin nhạy cảm.
* Route phải được kiểm soát theo role.
* Tách UI, API service và business logic phía frontend.
* Đặt tên component, function và file rõ ràng.
* Không commit file chứa secret hoặc environment riêng của cá nhân.

---

# 12. Environment

Các thông tin cấu hình frontend được đặt trong file environment.

Ví dụ:

```text
.env
.env.development
.env.production
```

Ví dụ:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Không commit các thông tin nhạy cảm vào repository.

---

# 13. Chạy project

Cài đặt dependencies:

```bash
npm install
```

Chạy development server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

# 14. Git Workflow

Mỗi thành viên phát triển trên branch riêng.

Ví dụ:

```text
main
develop
feature/login
feature/question-management
feature/exam-management
feature/ai-interview
feature/evaluation
feature/report
feature/admin
```

Quy trình:

```text
Create Branch
    |
    v
Develop
    |
    v
Commit
    |
    v
Push
    |
    v
Pull Request
    |
    v
Review
    |
    v
Merge
```

---

# 15. Mục tiêu Frontend

Frontend cần đảm bảo:

* Giao diện rõ ràng và dễ sử dụng.
* Phân quyền đúng theo role.
* Kết nối ổn định với Backend.
* Tái sử dụng component.
* Dễ bảo trì và mở rộng.
* Hỗ trợ đầy đủ flow thi vấn đáp AI.
* Hiển thị rõ ràng kết quả AI và điểm cuối cùng do lecturer xác nhận.


