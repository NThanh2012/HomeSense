# Frontend Structure Rules

- `client/` la NextJS frontend package `web`.
- Code nam trong `client/src`.
- App Router nam trong `client/src/app`.
- Component dung chung nam trong `client/src/components`.
- Feature API/types nam trong `client/src/features`.
- Shared types nam trong `client/src/types`.
- Shared helper nam trong `client/src/lib`.

## Feature API Rules
- Auth API nằm trong `features/auth`.
- Properties API nằm trong `features/properties`.
- Favorites API nằm trong `features/favorites`.
- Inquiries API nằm trong `features/inquiries`.
- Admin API nằm trong `features/admin`.
- Admin user signals API nằm trong `features/admin-user-signals`.
- Admin user demands API nằm trong `features/admin-user-demands`.
- Recommendations API nằm trong `features/recommendations`.
- User behavior API nằm trong `features/user-behaviors`.
- User preference API nằm trong `features/user-preferences`.
- Protected API phải truyền `Authorization: Bearer <token>`.
- Không gọi `fetch` trực tiếp trong page/component nếu API wrapper đã có.

## Property UI Rules
- `/properties` gọi `getProperties()` từ `features/properties/properties.api.ts`.
- `/properties/[id]` gọi `getPropertyById()` từ `features/properties/properties.api.ts`.
- `/dashboard/properties` dung `getMyProperties()`.
- `/dashboard/properties/new` dung `createMyProperty()` va co the `submitMyProperty()`.
- `/dashboard/properties/[id]` dung `getMyPropertyById()`, `updateMyProperty()` va `submitMyProperty()`.
- Seller listing form là UI duy nhất được phép tạo `Property`; người bán tự nhập các structured fields, không lấy nội dung từ nguồn ngoài, không gọi raw-post ingestion hoặc property-analysis.
- Tin mới luôn đi theo UI state `DRAFT` -> user gửi `PENDING_REVIEW` -> admin duyệt `PUBLISHED`; frontend không cung cấp cách bỏ qua review flow.
- Search/filter/sort phải sync qua URL query.
- Pagination phải giữ nguyên filter/sort hiện tại.
- Property/search behavior tracking chỉ chạy khi có token; tracking fail không được làm hỏng UI.

## Recommendation UI Rules
- Admin demand detail dùng `features/recommendations` để chạy matching và xem match.
- User dashboard `/dashboard/recommendations` dùng `GET /recommendations/me`.
- Feedback recommendation dùng `POST /recommendations/matches/:matchId/feedback`.
- Nút recompute recommendation dùng `POST /recommendations/me/recompute`.
- Component score/reason dùng chung nên đặt trong `mobile/src/components/recommendations`.
- Không để dashboard user phụ thuộc trực tiếp vào component admin nếu có component dùng chung.

## Admin UI Rules
- Admin pages nằm trong `mobile/src/app/admin`.
- Admin pages dùng `AdminRequired` để check localStorage token và role `ADMIN`.
- Không dùng Next middleware cho admin khi token vẫn lưu trong localStorage.
- Không render dữ liệu admin cho user không phải `ADMIN`.
- Không hiển thị link/page/form admin raw-property ingestion, raw-post import hoặc nút property-analysis.
- User demand signal UI chỉ dành cho admin và phải dùng feature wrappers riêng.
- Data source UI dùng `features/admin-data-sources`; source import UI dùng `features/admin-source-imports` và chỉ cho `USER_SIGNAL`/`EXTERNAL_BEHAVIOR`, không cho `PROPERTY_POST`.
- Raw detail chỉ hiển thị governance metadata allowlist, không dump arbitrary metadata trực tiếp.
- Không render hoặc nhập dữ liệu nhạy cảm ngoài phạm vi nhu cầu BĐS.

## Component Rules
- Component nhỏ, dễ đọc, typed bằng TypeScript.
- Component property dat trong `client/src/components/properties`.
- Component dashboard dat trong `client/src/components/dashboard`.
- Component admin dat trong `client/src/components/admin`.
- Component recommendation dung chung dat trong `client/src/components/recommendations`.
- Component state chung dat trong `client/src/components/common`.
- UI dùng CSS thường, responsive, không thêm Tailwind/shadcn/MUI nếu chưa được yêu cầu.
