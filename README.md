# HomeSense

HomeSense là website hỗ trợ đăng tin, tìm kiếm và gợi ý bất động sản theo nhu cầu của từng người dùng.

Hệ thống gồm frontend Next.js, backend NestJS, PostgreSQL cho dữ liệu nghiệp vụ và MongoDB cho dữ liệu thô từ các nguồn hợp lệ.

## Chức năng chính

- Đăng ký, đăng nhập và quản lý hồ sơ người dùng.
- Tìm kiếm, lọc và xem chi tiết bất động sản đã công khai.
- Lưu tin và gửi yêu cầu liên hệ.
- Người bán tạo tin bằng biểu mẫu có cấu trúc, lưu nháp và gửi quản trị viên duyệt.
- Quản trị viên kiểm duyệt tin, người dùng, yêu cầu liên hệ và nguồn dữ liệu.
- Phân tích tín hiệu nhu cầu từ hành vi trong hệ thống và nguồn bên ngoài được cho phép.
- Tạo nhiều nhóm ý định và xếp hạng gợi ý bằng thuật toán có thể giải thích.
- Xử lý tác vụ học nhu cầu và tính lại gợi ý bằng PostgreSQL job runner.

## Công nghệ

- Frontend: Next.js 15, React 19, TypeScript.
- Backend: NestJS 11, TypeScript.
- Cơ sở dữ liệu nghiệp vụ: PostgreSQL 16, Prisma 6.
- Dữ liệu thô: MongoDB 7, Mongoose 8.
- Môi trường local: Docker Compose, pnpm workspace.
- Trích xuất dự phòng: Gemini API.

## Cấu trúc dự án

```text
client/    Giao diện Next.js
server/    REST API NestJS và Prisma
infra/     Cấu hình Docker Compose
```

## Chạy dự án trên máy cá nhân

### 1. Cài thư viện

```bash
corepack pnpm install
```

### 2. Cấu hình môi trường

Tạo các file môi trường từ những file mẫu sau:

- `.env.example` thành `.env`.
- `server/.env.example` thành `server/.env`.
- `client/.env.example` thành `client/.env.local`.

`GEMINI_API_KEY` có thể để trống nếu chỉ sử dụng bộ phân tích theo luật và bộ nhớ đệm.

### 3. Khởi động cơ sở dữ liệu

```bash
docker compose -f infra/docker-compose.yml up -d
```

PostgreSQL sử dụng cổng `5433`; MongoDB sử dụng cổng `27017`.

### 4. Chuẩn bị Prisma

```bash
corepack pnpm --filter api prisma:generate
corepack pnpm --filter api prisma:migrate:deploy
```

### 5. Khởi động ứng dụng

Mở hai terminal và chạy:

```bash
corepack pnpm dev:api
```

```bash
corepack pnpm dev:web
```

- Website: `http://localhost:3000`.
- API: `http://localhost:3001`.

## Nguyên tắc dữ liệu

- Chỉ tài khoản đã xác thực mới được tạo tin bất động sản bằng biểu mẫu có cấu trúc.
- Tin mới bắt đầu ở trạng thái `DRAFT`, sau đó được gửi duyệt và chỉ hiển thị công khai khi chuyển thành `PUBLISHED`.
- Dữ liệu hành vi bên ngoài chỉ phục vụ phân tích nhu cầu; không được dùng để tạo tin đăng.
- MongoDB chỉ lưu dữ liệu thô; PostgreSQL lưu dữ liệu đã chuẩn hóa và nghiệp vụ người dùng.
- Gemini chỉ hỗ trợ trích xuất khi luật và bộ nhớ đệm chưa xử lý được; mô hình không quyết định thứ hạng gợi ý.
- Luồng `RawPost` và `PropertyAnalysis` cũ được giữ để tương thích nhưng không được dùng để tạo `Property` mới.
