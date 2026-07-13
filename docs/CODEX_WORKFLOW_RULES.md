# Codex Workflow Rules

- Trước khi code phải đọc `AGENTS.md`.
- Nếu làm backend, đọc thêm:
    - `MODULE_STRUCTURE_RULES.md`
    - `BACKEND_STYLE_RULES.md`
    - `API_RESPONSE_RULES.md`
    - `DATABASE_RULES.md`
    - `PRIVACY_AND_DATA_RULES.md` nếu xử lý raw data, user demand, recommendation hoặc behavior tracking.
- Nếu làm frontend, đọc thêm:
    - `FRONTEND_STRUCTURE_RULES.md`
    - `API_CONTRACT_SNAPSHOT.md`

## Do Not
- Không tự ý thêm thư viện lớn.
- Không tự ý đổi kiến trúc.
- Không tự ý thêm CQRS/microservice/queue.
- Không tự ý tạo notification/payment khi phase chưa yêu cầu.
- Không tự ý gọi API ngoài wrapper feature đã có.
- Không tự ý nâng auth lên OAuth/JWT refresh token/permission phức tạp nếu chưa được yêu cầu.
- Không tự ý thêm crawler/scraper, bypass login/captcha/paywall hoặc automation lấy dữ liệu ngoài.
- Không gọi user demand analysis hoặc behavior learning là personality profiling.
- Không tự ý thêm AI/LLM hoặc recommendation engine ngoài.
- Không lưu hoặc suy luận dữ liệu nhạy cảm không liên quan BĐS.

## When Coding Backend
- Controller mỏng, service xử lý logic.
- Lỗi nghiệp vụ dùng `ApiException` + `ResponseCode`.
- Route cần đăng nhập dùng `TokenGuard` và `@CurrentUser()`.
- Route admin dùng `TokenGuard`, `RolesGuard` và `@Roles(UserRole.ADMIN)`.
- DTO validate tiếng Việt, field bắt buộc dùng `... không được để trống`.
- Không trả field nhạy cảm của user.
- Khong expose raw-post/property-analysis ingestion; chi authenticated seller structured form duoc tao `Property`.
- `USER_SIGNAL`, `EXTERNAL_BEHAVIOR`, source import va Gemini khong duoc tao hoac sua `Property`.
- User demand ingestion chỉ tạo `RawUserSignal`; `UserDemand` phải sinh qua demand-analysis pipeline.
- Behavior event phải gắn với current user; external event chỉ được materialize từ governed source có quyền sử dụng rõ ràng, đã link và audit.

## When Coding Frontend
- Property pages dùng `features/properties`.
- Auth pages dùng `features/auth`.
- Favorites dùng `features/favorites`.
- Inquiries dùng `features/inquiries`.
- Admin dùng `features/admin`.
- Admin user signals dùng `features/admin-user-signals`.
- Admin user demands dùng `features/admin-user-demands`.
- Admin data sources dùng `features/admin-data-sources`.
- Admin source imports dùng `features/admin-source-imports`.
- Recommendations dùng `features/recommendations`.
- User behavior tracking dùng `features/user-behaviors`.
- User preference profile dùng `features/user-preferences`.
- Type feature dùng file `*.types.ts` tương ứng.
- UI dùng CSS thường, responsive, không thêm UI library nếu chưa được yêu cầu.
- Admin UI phải check role `ADMIN` trước khi render dữ liệu.
- Tracking fail phải được catch, không làm hỏng UI chính.

## When Implementing A Plan
- Sau khi implement, cập nhật Markdown liên quan nếu current state, API contract, database rule, frontend rule hoặc workflow rule thay đổi.
- Luôn cập nhật `docs/IMPLEMENTATION_PROGRESS.html`.
- HTML progress phải ghi rõ:
    - phase hoặc milestone đã làm,
    - file đã tạo/sửa,
    - backend/frontend/docs changes,
    - API contract nếu có thay đổi,
    - database/migration nếu có,
    - verify commands đã chạy,
    - kết quả pass/fail và warning nếu có.
- Không báo hoàn thành nếu chưa cập nhật HTML progress theo yêu cầu trên.
