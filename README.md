# Minh Châu Digital Learning — v0.1 Prototype

## Mục tiêu
Một platform duy nhất để quản lý nhiều giáo trình, Skills Lab, Exam Center, bài tập, tiến độ và Teacher Dashboard. Không tạo website mới cho mỗi Unit/course.

## Bản v0.1 có gì
- Dashboard platform.
- Course catalog có sẵn Objectives B1/B2, Life A2–B1, TACN HP5/HP6.
- Objectives B1 → CK1 → Unit 1 → Lesson 1.1 / 1.2.
- Audio Track 2, 3, 4 chạy trực tiếp.
- Quick Check chấm tự động.
- Lưu tiến độ demo bằng localStorage.
- Mobile responsive + PWA shell.
- Teacher Dashboard placeholder.

## Kiến trúc mở rộng
Content model:
`Platform → Program → Course/Class → Unit → Lesson → Section/Activity`

System modules:
`Courses | Skills Lab | Exam Center | Question Bank | Assignments | Submissions | Progress | Teacher Analytics`

## Bước backend (v0.2)
Giữ nguyên data model và thay service localStorage bằng Supabase adapter:
- auth/users
- classes/enrolments
- attempts/results
- assignments/submissions
- storage for photos/audio
- teacher roles

AI/OCR/Speaking sẽ gọi qua server-side/edge function để không lộ API key.

## Cách chạy
Cách đơn giản: upload toàn bộ thư mục lên GitHub Pages/Cloudflare Pages.
Có thể chạy local bằng một static server; ví dụ Python: `python3 -m http.server 8000` rồi mở http://localhost:8000.

## Thêm giáo trình mới
1. Thêm card trong `src/data/catalog.js`.
2. Tạo file data mới trong `src/data/` theo model Objectives B1.
3. Map id course vào `dataByProgram` trong `src/app.js`.
Không tạo repo/site mới.

## Lưu ý
- Đây là prototype dữ liệu/UX, chưa phải hệ thống tài khoản thật.
- Đề kiểm tra có tính bảo mật sẽ chuyển answer key/scoring sang backend ở bản sau.


## Public GitHub demo safety
This public-safe demo intentionally excludes copyrighted course audio/PDF files and all student data. Connect protected storage/backend before adding those assets.
