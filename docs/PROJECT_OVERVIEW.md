# Project Overview

- HomeSense là web mua bán bất động sản.
- `client/` la frontend NextJS package `web`.
- `server/` là backend NestJS.
- Backend đi theo modular monolith đơn giản, dễ học.

## Current State
- Backend đã có module:
    - `health`, `properties`,
    - `users`, `auth`, `favorites`, `inquiries`,
    - `admin`, `user-signals`, `user-demands`, `demand-analysis`,
    - `recommendations`, `user-behaviors`, `user-preferences`,
    - `data-sources`, `source-imports`, `external-behaviors`,
    - `user-learning`, `learning-jobs`.
- `raw-posts` và `property-analysis` chỉ còn là legacy code/schema để tương thích dữ liệu cũ; ingestion/analyze route tạo property không còn là runtime được hỗ trợ.
- Backend đã chạy được:
    - seller tự nhập toàn bộ form có cấu trúc -> PostgreSQL Property draft -> admin review -> publish,
    - auth/users,
    - favorites/inquiries,
    - admin data management,
    - search/filter/sort property public,
    - raw user demand signal -> demand analysis -> user demand,
    - user demand -> demand-property matching -> recommendations,
    - website behavior events -> preference profile -> behavior-boosted recommendations,
    - website/external behavior -> canonical signals -> multi-intent -> background recompute -> recommendations,
    - rule-based/cache extraction -> Gemini fallback cho external payload kho.
- Auth dùng token UUID lưu trên `User.authToken`.

## Frontend Current State
- Frontend đã có:
    - `/properties`, `/properties/[id]`,
    - `/auth/login`, `/auth/register`,
    - `/dashboard`, `/dashboard/profile`, `/dashboard/favorites`, `/dashboard/inquiries`,
    - `/dashboard/properties`, `/dashboard/properties/new`, `/dashboard/properties/[id]`,
    - `/dashboard/recommendations`,
    - `/admin`, `/admin/properties`, `/admin/inquiries`, `/admin/users`,
    - `/admin/user-signals`, `/admin/user-signals/new`, `/admin/user-signals/[id]`,
    - `/admin/user-demands`, `/admin/user-demands/[id]`,
    - `/admin/data-sources`, `/admin/data-sources/new`, `/admin/data-sources/[id]`,
    - `/admin/source-imports`, `/admin/source-imports/json`, `/admin/source-imports/[id]`,
    - `/admin/learning-jobs`, `/admin/learning-jobs/[id]`,
    - `/admin/external-behaviors`.
- `/properties` hỗ trợ URL query cho keyword, giao dịch, loại BĐS, giá, diện tích, tỉnh/thành, quận/huyện và sort.
- Dashboard recommendations có view/click/dismiss tracking và nút recompute recommendation.
- Admin demand UI có section ghép nhu cầu BĐS, chỉ dành cho `UserRole.ADMIN`.

## Database Ownership
- MongoDB/Mongoose lưu dữ liệu thô:
    - `RawPost` legacy (chỉ giữ dữ liệu cũ, không còn ingestion property mới),
    - `RawUserSignal`,
    - `RawExternalBehavior`.
- PostgreSQL/Prisma lưu dữ liệu chuẩn hóa và nghiệp vụ:
    - properties, locations, property media, property analysis,
    - users, favorites, inquiries,
    - user demands, demand analysis,
    - demand-property matches,
    - user behavior events, user preference profiles,
    - external user links, external behavior analyses, behavior-derived demands,
    - canonical preference signals, multi-intent, location anchors, learning jobs va LLM extraction cache.

## Current Scope
- Phase 11 đã có recommendation feedback + user behavior learning loop rule-based.
- Backend spec files đã được xóa khỏi `server/src`; test root riêng hiện là `server/test`.
- Chỉ seller-submitted listing được tạo `Property`: người bán tự nhập toàn bộ form có cấu trúc trong PostgreSQL, mặc định `DRAFT`, gửi admin thành `PENDING_REVIEW`, admin mới publish `PUBLISHED`.
- `RawPost`, `property-analysis`, admin raw-post ingestion và governed `PROPERTY_POST` import đã bị vô hiệu hóa; dữ liệu ngoài hệ thống không được chuyển thành tin BĐS.
- Schema/rows legacy vẫn được giữ không phá hủy. `RawUserSignal` và `RawExternalBehavior` có thể tiếp tục phục vụ learning/recommendation nhưng không được tạo `Property`.
- Verify gần nhất: API build passed; API test passed 2 suites/15 tests; web `tsc --noEmit` và production build passed.
- Phase 12 đã có Hybrid Ranking v1 với base match, preference boost, feedback boost, freshness boost và status penalty.
- Recommendation Evaluation đã được loại bỏ để giữ phạm vi dự án đơn giản.
- Phase 13 đã có authorized source governance:
    - quản lý nguồn dữ liệu và permission trong PostgreSQL,
    - import JSON có audit batch/record cho `RawUserSignal` hoặc `RawExternalBehavior`, không nhận `PROPERTY_POST`,
    - raw records mới có provenance và ingest metadata,
    - admin pages `/admin/data-sources` và `/admin/source-imports`,
    - không crawler/scraper, không connector thật, không tự tạo normalized record.
- External behavior learning nhận `DEV_SYNTHETIC` hoặc nguồn social/partner có `AUTHORIZED_API`, `PARTNER_AGREEMENT`, `USER_SUBMITTED`; admin liên kết `externalUserRef` với tài khoản trước khi phân tích. Dữ liệu hiện đi qua governed import/API nội bộ, chưa có connector tự động.
- Matching và behavior boost chỉ dùng tiêu chí BĐS: giao dịch, loại BĐS, giá, diện tích, khu vực, từ khóa, hành vi trong website.
- Phase 15-21 dùng canonical signals + multi-intent, PostgreSQL DB job runner, rich property features, event-driven decay và unified ranking.
- Login chỉ queue/promote job; không gọi hoặc chờ Gemini. LLM chỉ fallback extraction và không xếp hạng recommendation.
- Chưa triển khai notification, payment, crawler/scraper, queue chuyên dụng, microservice, CQRS hoặc role permission phức tạp.
