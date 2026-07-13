# API Contract Snapshot

## Dev Base URL
- `http://localhost:3001`

## Success Response
```json
{
    "code": "0000",
    "message": "Success",
    "data": {}
}
```

## Pagination Data
```json
{
    "items": [],
    "meta": {
        "page": 1,
        "limit": 20,
        "total": 0,
        "totalPages": 0
    }
}
```

## Public Property Endpoints
- `GET /properties`
- `GET /properties/:id`

Query params:
- `page`, `limit`, `keyword`
- `transactionType`, `propertyType`
- `minPrice`, `maxPrice`
- `minArea`, `maxArea`
- `province`, `district`
- `sortBy=createdAt|price|area`
- `sortOrder=asc|desc`

Public property APIs chỉ hiển thị property `PUBLISHED`.

## Seller Property Endpoints
All seller property endpoints require `Authorization: Bearer <token>`.

- `POST /properties/me`
  - Body la form co cau truc: `title`, `description?`, `transactionType`, `propertyType`, `price?`, `area?`, `bedrooms?`, `bathrooms?`, `furnishingStatus?`, `legalStatus?`, `direction?`, `amenities?`, `contactPhone?`, `mediaUrls?`, `province?`, `district?`, `ward?`, `street?`, `rawAddress?`, `latitude?`, `longitude?`.
  - Tao `Property` truc tiep trong PostgreSQL voi `status = DRAFT`, `sourceName = USER_SUBMITTED`, `createdByUserId = current user`.
  - Khong tao `RawPost` va khong tu chay `property-analysis`.
- `GET /properties/me?page=&limit=`
- `GET /properties/me/:id`
- `PATCH /properties/me/:id`
  - Chi sua tin cua chinh user khi status la `DRAFT` hoac `PENDING_REVIEW`.
  - Sua tin dang `PENDING_REVIEW` se dua ve `DRAFT` de user gui duyet lai.
- `PATCH /properties/me/:id/submit`
  - Chuyen `DRAFT` sang `PENDING_REVIEW`.

## Disabled Property Ingestion Endpoints
- Các route `raw-posts`, `property-analysis/raw-posts/:id` và `admin/raw-posts` không còn được expose để tạo/phân tích tin BĐS.
- Không có API import hoặc admin API nào được phép tạo `Property` từ nội dung ngoài hệ thống.
- Schema và dữ liệu legacy liên quan vẫn được giữ không phá hủy; đây không phải contract runtime để tạo tin mới.

## Auth/User Endpoints
- `POST /auth/register`
- `POST /auth/login`
  - Response bo sung `recommendationRefresh: { status: "CURRENT" | "QUEUED" | "PROCESSING" | "FAILED", jobId?, hasExistingRecommendations }`.
  - Login chi queue/promote background job; khong goi hoac cho Gemini.
- `POST /auth/logout`
- `GET /users/me`
- `PATCH /users/me`

## Favorites/Inquiries Endpoints
- `POST /favorites`
- `GET /favorites?page=&limit=`
- `GET /favorites/check/:propertyId`
- `DELETE /favorites/:propertyId`
- `POST /inquiries`
- `GET /inquiries/me?page=&limit=`
- `GET /inquiries/:id`

## User Behavior And Preferences Endpoints
- `POST /user-behaviors`
  - Body: `{ eventType, propertyId?, demandId?, matchId?, keyword?, filters?, metadata?, eventKey? }`.
- `GET /user-behaviors/me?page=&limit=&eventType=`
- `GET /user-preferences/me`
- `POST /user-preferences/recompute`
- `GET /users/me/real-estate-context`
- `PATCH /users/me/real-estate-context`
  - Body: `{ anchors: [{ anchorType, rawLocation, province?, district?, label?, baseWeight? }] }`.
- `GET /users/me/intents`
- `PATCH /users/me/intents/:id/status`
- `GET /users/me/real-estate-data/export`
- `DELETE /users/me/real-estate-data`

`UserBehaviorEventType` hiện có:
- `PROPERTY_VIEW`, `PROPERTY_SAVE`, `PROPERTY_UNSAVE`, `INQUIRY_CREATED`
- `SEARCH`, `FILTER_APPLIED`
- `RECOMMENDATION_VIEW`, `RECOMMENDATION_CLICK`, `RECOMMENDATION_SAVE`
- `RECOMMENDATION_DISMISS`, `RECOMMENDATION_CONTACT`

## Recommendations Endpoints

### Admin
- `POST /admin/recommendations/user-demands/:demandId/run`
- `GET /admin/recommendations/user-demands/:demandId/matches`
  - Query: `page`, `limit`, `minScore`, `status=ACTIVE|DISMISSED|CONTACTED|OUTDATED`.
- `PATCH /admin/recommendations/matches/:matchId/status`
  - Body: `{ "status": "ACTIVE" | "DISMISSED" | "CONTACTED" | "OUTDATED" }`.

### User
- `GET /recommendations/me`
  - Query: `page`, `limit`, `minScore`.
  - Chỉ trả `DemandPropertyMatch.status = ACTIVE`.
- `POST /recommendations/matches/:matchId/feedback`
  - Body: `{ "feedbackType": "VIEWED" | "CLICKED" | "SAVED" | "DISMISSED" | "CONTACTED", "metadata": {} }`.
  - `DISMISSED` cập nhật match status sang `DISMISSED`.
  - `CONTACTED` cập nhật match status sang `CONTACTED`.
- `POST /recommendations/me/recompute`
  - Recompute preference profile và chạy matching lại cho demand của user hiện tại.

## Admin Endpoints
All admin endpoints require `Authorization: Bearer <token>` and `UserRole.ADMIN`.

- `POST /admin/data-sources`
- `GET /admin/data-sources?page=&limit=&keyword=&sourceType=&permissionType=&isActive=`
- `GET /admin/data-sources/:id`
- `PATCH /admin/data-sources/:id`
- `PATCH /admin/data-sources/:id/status`
- `POST /admin/source-imports/json`
  - Body: `{ dataSourceId, targetType: "USER_SIGNAL" | "EXTERNAL_BEHAVIOR", items: [] }`.
  - `PROPERTY_POST` bị từ chối; source import không được tạo `RawPost` hoặc `Property`.
  - Tối đa 50 records; chỉ ghi raw MongoDB, không tự chạy analysis.
- `GET /admin/source-imports?page=&limit=&dataSourceId=&targetType=&status=`
- `GET /admin/source-imports/:id`
- `GET /admin/users?page=&limit=&keyword=`
- `GET /admin/external-behaviors?page=&limit=&dataSourceId=&externalUserRef=&status=`
- `GET /admin/external-behaviors/:id`
- `POST /admin/external-behaviors/:id/retry`
- `GET /admin/learning-jobs?page=&limit=&type=&status=&userId=`
- `GET /admin/learning-jobs/:id`
- `POST /admin/learning-jobs/:id/retry`
- `POST /admin/users/:userId/learning/run`
- `GET /admin/users/:userId/intents`
- `GET /admin/users/:userId/preference-signals`
- `POST /admin/external-user-links`
  - Body: `{ dataSourceId, externalUserRef, userId }`.
- `GET /admin/external-user-links?page=&limit=&dataSourceId=&userId=&externalUserRef=&isActive=`
- `PATCH /admin/external-user-links/:id/status`
  - Body: `{ isActive }`.
- `GET /admin/overview`
- `GET /admin/properties?page=&limit=&keyword=&status=`
  - `status` gom `DRAFT | PENDING_REVIEW | PUBLISHED | ARCHIVED`.
- `GET /admin/properties/:id`
- `PATCH /admin/properties/:id/status`
- `GET /admin/inquiries?page=&limit=&status=`
- `GET /admin/inquiries/:id`
- `PATCH /admin/inquiries/:id/status`
- Admin user signals/user demands/demand analysis routes.

## Contract Notes
- Protected routes dùng header `Authorization: Bearer <token>`.
- Chỉ seller đã đăng nhập và tự nhập form có cấu trúc qua `POST /properties/me` được tạo `Property` mới.
- Raw-post ingestion/property-analysis đã bị vô hiệu hóa; `RawPost` hoặc dữ liệu import cũ không được materialize thành `Property`.
- Admin user demand ingestion chỉ tạo `RawUserSignal`; `UserDemand` sinh qua demand-analysis pipeline.
- Behavior learning dùng hành vi trong website và external behavior từ nguồn được cấp quyền, đã linked và phân tích thành tiêu chí BĐS.
- `USER_SIGNAL` và `EXTERNAL_BEHAVIOR` chỉ phục vụ demand/learning/recommendation, không được tạo hoặc sửa `Property`.
- Demand analysis và recommendation không phân tích tính cách hoặc thuộc tính nhạy cảm.
- Phase 13 import chỉ cho phép source active có permission hợp lệ; `UNKNOWN` không được import.
- Duplicate governed import trả record status `SKIPPED`, không ghi đè raw record cũ.
- Existing `PROPERTY_POST` batches, `RawPost`, `PropertyAnalysis` và quan hệ legacy được giữ nguyên để audit/tương thích; không có cleanup phá hủy trong thay đổi seller-only.
- Background learning/recompute dùng PostgreSQL DB job runner trong modular monolith.
- Gemini chỉ trích xuất structured BĐS signals sau rule-based/cache; không rank recommendation.
- `GET /recommendations/me` trả unified list dedupe theo property và bổ sung intent reference cùng expanded score breakdown.
- Gemini Phase 14 chỉ trích xuất structured BĐS signals; không rank recommendation, crawler/scraper, queue hoặc recommendation engine ngoài.

## Phase 14 Contract Notes
- External behavior import chấp nhận active `DEV_SYNTHETIC` source hoặc `FACEBOOK`/`WEBSITE`/`PARTNER_API`/`MANUAL_IMPORT`/`OTHER` đi cùng `AUTHORIZED_API`/`PARTNER_AGREEMENT`/`USER_SUBMITTED`; payload tối đa 64KB/item. `PUBLIC_ALLOWED` không đủ để liên kết hành vi cá nhân.
- Admin phai link `(dataSourceId, externalUserRef)` voi user truoc khi background learning co the xu ly.
- Gemini chi trich xuat structured BDS signals; khong rank recommendation va khong nam tren login path.
