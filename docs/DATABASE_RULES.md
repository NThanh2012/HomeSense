# Database Rules

## MongoDB/Mongoose
- Chỉ dùng cho dữ liệu thô.
- Model hiện có:
    - `RawPost` (legacy, không nhận property post mới),
    - `RawUserSignal`,
    - `RawExternalBehavior`.
- Raw-post/property ingestion đã bị vô hiệu hóa; không service/API/import nào được tạo `RawPost` mới để sinh tin đăng.
- Seller-submitted listing khong ghi vao MongoDB raw collections.
- User demand ingestion chỉ ghi dữ liệu thô vào `RawUserSignal`.
- Quy tắc duplicate `RawPost` cũ được giữ để tương thích dữ liệu lịch sử; không còn là ingestion contract đang hoạt động.
- Duplicate raw user signal xử lý theo `sourceType + externalId`, fallback `sourceUrl`, fallback `contentHash`.
- Governed import cho `USER_SIGNAL`/`EXTERNAL_BEHAVIOR` chống trùng theo `dataSourceId + externalId`, fallback `dataSourceId + sourceUrl`, fallback `dataSourceId + contentHash`.
- Duplicate governed import phải `SKIP`, không update raw evidence cũ.
- External behavior duplicate scope: `dataSourceId + externalId`, fallback stable `dataSourceId + contentHash`.

## PostgreSQL/Prisma
- Dùng cho dữ liệu đã phân tích/chuẩn hóa và nghiệp vụ user.
- Model hiện có:
    - `Property`, `Location`, `PropertyMedia`, `PropertyAnalysis`,
    - `User`, `Favorite`, `Inquiry`,
    - `UserDemand`, `UserDemandSignal`, `DemandAnalysis`,
    - `DemandPropertyMatch`,
    - `UserBehaviorEvent`, `UserPreferenceProfile`,
    - `DataSource`, `SourceImportBatch`, `SourceImportRecord`,
    - `ExternalUserLink`, `ExternalBehaviorAnalysis`.
- `Property.createdByUserId` danh dau tin do user HomeSense tu dang.
- `PropertyStatus` gom `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `ARCHIVED`.
- Chỉ authenticated seller structured form được tạo `Property`; bản ghi mới bắt đầu ở `DRAFT`, sau đó `PENDING_REVIEW` và chỉ admin mới publish.
- Enum hiện có:
    - `UserRole`, `UserStatus`,
    - `PropertyStatus`, `TransactionType`, `PropertyType`,
    - `InquiryStatus`,
    - `DemandType`, `UserDemandStatus`,
    - `DemandMatchStatus`,
    - `UserBehaviorEventType`,
    - `UserDemandOrigin`, `UserBehaviorSource`, `ExternalBehaviorAnalysisStatus`.
- `DemandMatchStatus` hiện dùng:
    - `ACTIVE`: đang được gợi ý,
    - `DISMISSED`: admin/user đã bỏ qua,
    - `CONTACTED`: đã liên hệ,
    - `OUTDATED`: match cũ không còn nằm trong kết quả recompute mới.

## Behavior Learning Data
- `UserBehaviorEvent` lưu hành vi BĐS trong website hoặc external behavior từ nguồn được cấp quyền, đã được link và phân tích.
- `UserPreferenceProfile` là profile nhu cầu BĐS tính từ behavior events, không phải personality profile.
- Chỉ tính preference từ dữ liệu BĐS:
    - transaction type,
    - property type,
    - location,
    - price,
    - area,
    - keyword.
- `eventKey` chỉ dùng cho event cần chống trùng/idempotency, không dùng để seed dữ liệu mẫu.

## Phase 14 External Behavior Learning
- `RawExternalBehavior` nhận arbitrary payload từ active `DEV_SYNTHETIC` source hoặc social/partner source có quyền `AUTHORIZED_API`, `PARTNER_AGREEMENT` hay `USER_SUBMITTED`.
- `ExternalUserLink` gan `(dataSourceId, externalUserRef)` voi mot user HomeSense.
- `ExternalBehaviorAnalysis` luu structured BDS result va raw Mongo id, khong luu lai raw payload.
- External `UserBehaviorEvent` va behavior-derived `UserDemand` phai co source/origin ro rang va idempotent.
- Gemini chi trich xuat tieu chi BDS; recommendation ranking van rule-based.

## Boundaries
- Không trộn dữ liệu thô và dữ liệu chuẩn hóa nếu không cần.
- PostgreSQL lưu raw Mongo id dạng string để tham chiếu.
- Không dùng transaction xuyên MongoDB và PostgreSQL.
- Không tạo `Property` từ import JSON, raw data, `RawPost`, user signal, external behavior hoặc LLM.
- Nguồn tạo `Property` duy nhất: authenticated seller tự nhập form có cấu trúc vào PostgreSQL với `status = DRAFT`, `sourceName = USER_SUBMITTED`, `createdByUserId`; user gửi duyệt thành `PENDING_REVIEW`, admin mới publish.
- Demo seed chỉ phục vụ local development, dùng ID cố định và mô phỏng các property đã đi qua seller/admin flow; mọi property demo đều có `createdByUserId`, `sourceName = USER_SUBMITTED`, không tạo `RawPost` hoặc `PropertyAnalysis` và không xóa dữ liệu khác.
- Không tạo trực tiếp normalized `UserDemand` từ form raw signal.
- Pipeline `RawPost` -> `property-analysis` -> `Property` đã bị vô hiệu hóa. Seller-submitted `Property` không tạo `RawPost` và không chạy property-analysis.
- `UserDemand` explicit sinh qua demand-analysis pipeline; behavior-derived demand Phase 14 sinh từ external behavior analysis đã audit.
- `DemandPropertyMatch` phải sinh qua recommendation/matching service.
- Behavior boost chỉ điều chỉnh nhẹ score, không thay thuật toán nền bằng AI/ML.
- Không lưu/suy luận dữ liệu nhạy cảm không liên quan BĐS.
- Không thêm crawler/scraper hoặc ingestion batch phức tạp nếu phase chưa yêu cầu.
- Batch import chạy đồng bộ tối đa 50 records chỉ cho `USER_SIGNAL`/`EXTERNAL_BEHAVIOR`, không queue và không transaction xuyên PostgreSQL/MongoDB.
- Enum/column, `RawPost`, `PropertyAnalysis`, source-import batch/record và row lịch sử được giữ không phá hủy; `PROPERTY_POST` cũ chỉ là dữ liệu legacy/audit, không phải target import hợp lệ mới.

## Phase 15-21 Learning Core
- PostgreSQL lưu `UserPreferenceSignal`, `UserRealEstateIntent`, `IntentPreferenceSignal`, `UserLocationAnchor`.
- PostgreSQL DB job runner dùng `LearningJob`, `LearningJobItem`, `RecommendationRecomputeJob`; không dùng queue chuyên dụng.
- `LlmExtractionCache` lưu structured extraction cache, không lưu raw payload thay MongoDB.
- Rich property features nằm trên `Property`, `PropertyAnalysis` và `PropertyNearbyPlace`.
- Raw external success chỉ xóa sau khi analysis, canonical signals/intents và audit PostgreSQL đã lưu thành công.
- Raw external `FAILED`/`REVIEW_REQUIRED` được giữ để audit và retry.
