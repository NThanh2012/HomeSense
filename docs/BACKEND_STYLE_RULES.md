# Backend Style Rules

- Import nội bộ dùng đuôi `.ts`.
- Indent 4 spaces.
- Giữ code dễ đọc cho người mới học NestJS.

## Controller
- Controller phải mỏng.
- Controller chỉ nhận DTO/query/param, gọi service, trả `ApiResponse.success(result)`.
- Không viết business logic trong controller.
- Không tự tạo format response khác.

## DTO
- DTO dùng `class-validator`.
- Message validation viết tiếng Việt.
- Field bắt buộc dùng message dạng: `... không được để trống`.
- Dùng `class-transformer` cho query number nếu cần.
- Dùng `IsEnum` cho status/role enum.

## Service
- Service xử lý business logic.
- Lỗi nghiệp vụ dùng `ApiException` + `ResponseCode`.
- Không dùng `throw new Error()` cho lỗi nghiệp vụ.
- Không return object lỗi thủ công.
- Có thể tách service phụ nếu logic riêng rõ ràng.

## Module
- Module khai báo rõ:
    - `imports`
    - `controllers`
    - `providers`
    - `exports`
- Không import module ngoài scope phase hiện tại nếu chưa dùng.

## Auth And Admin
- Route cần user đăng nhập dùng `TokenGuard` và `@CurrentUser()`.
- Route admin dùng `TokenGuard`, `RolesGuard` và `@Roles(UserRole.ADMIN)`.
- Không tự ý thêm permission nhiều cấp nếu phase chưa yêu cầu.
- Admin khong co raw-property ingestion route va khong tao `Property` tu raw post/import.
- Chi authenticated seller structured form duoc tao `Property`; admin chi review va cap nhat status.
