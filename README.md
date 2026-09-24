# E-LEAP — v0.7 Prototype

**English Learning, Evaluation & Analytics Platform**

Một platform duy nhất để quản lý nhiều giáo trình, Skills Lab, Exam Center, bài tập, tiến độ, Teacher Dashboard và dữ liệu Learning Analytics phục vụ cải tiến đào tạo/NCKH.

## v0.7 thay đổi chính
- Rebrand từ Minh Châu Digital Learning sang **E-LEAP**.
- Objectives B1 được giữ lại; Objectives B2 · Objective First được đánh dấu là hướng ưu tiên từ 2027.
- Sửa UX: mỗi activity có nút **Mở nội dung** riêng; nút **Đánh dấu hoàn thành** chỉ lưu progress.
- Thêm trang nội dung sâu cho Unit 1.1 / 1.2.
- Giữ cấu trúc mở: `Platform → Program → Course/Class → Unit → Lesson → Section/Activity`.
- Public demo không chứa PDF/audio bản quyền hoặc dữ liệu học viên.

## Modules
`Courses | Skills Lab | Exam Center | Question Bank | Assignments | Submissions | Progress | Teacher Analytics`

## Backend roadmap
Supabase/Auth/Storage sẽ được nối sau cho tài khoản, lớp, điểm, bài nộp ảnh/audio và dữ liệu nghiên cứu. AI/OCR/Speaking gọi server-side để không lộ API key.


## v0.7
- Expanded Objectives B1 Unit 1 Lesson 1.1 from the full 33-slide teaching deck.
- Added lesson outcomes and 12 learning stages.
- Added embedded mini auto-check quizzes.
- Kept commercial book scans/audio out of the public repository.


## v0.7
- Added dual-mode lesson delivery: Classroom Delivery and Student Self-study.
- Unit 1.1 Classroom Delivery now contains 33 screen-by-screen teaching stages mapped to the original PPT.
- Added Previous/Next, Reveal answer, fullscreen and screen index controls.


## v0.7
- Makes the three lesson-use choices explicit: Dạy trên lớp, Tự học, Trình chiếu.
- Presentation mode hides navigation/chrome and enlarges lesson content for projection.
- Classroom Delivery remains the teacher-controlled mode with Next/Previous and Reveal answer.


## v0.7
- Cache-bust + service worker v0.7 to force dark-green UI.
- Private Media Pack loader: teacher selects the local media-pack folder; images/video/audio render on mapped classroom slides without uploading copyrighted media to GitHub.
