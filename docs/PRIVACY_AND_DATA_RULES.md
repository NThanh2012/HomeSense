# Privacy And Data Rules

## User Demand Signal Scope
- Chỉ phân tích tín hiệu nhu cầu bất động sản của người dùng.
- Có thể suy luận:
    - nhu cầu mua, thuê, bán,
    - loại bất động sản quan tâm,
    - khu vực quan tâm,
    - khoảng giá,
    - khoảng diện tích,
    - số điện thoại nếu người dùng tự cung cấp hoặc công khai hợp lệ,
    - confidence của nhu cầu BĐS.

## Recommendation Scope
- Matching/recommendation chỉ được dùng tiêu chí BĐS:
    - loại giao dịch,
    - loại BĐS,
    - giá,
    - diện tích,
    - vị trí,
    - từ khóa trong nhu cầu/property,
    - hành vi trong website liên quan trực tiếp đến BĐS.
- `matchReasons` phải giải thích bằng ngôn ngữ BĐS cụ thể.
- Behavior boost chỉ là điều chỉnh nhẹ dựa trên hành vi BĐS trong website.
- Hybrid ranking chi dung base match, preference BDS, feedback trong website, freshness va status penalty.
- Không gọi recommendation hoặc behavior learning là personality profiling.
- Không suy luận sở thích, tâm lý hoặc thuộc tính nhạy cảm ngoài nhu cầu BĐS.

## Behavior Tracking Scope
- Chỉ tracking hành vi trong website HomeSense khi user đã đăng nhập.
- Hành vi được phép lưu:
    - xem property,
    - lưu/bỏ lưu property,
    - gửi inquiry,
    - search/filter,
    - xem/click/lưu/bỏ qua/liên hệ recommendation.
- Tracking fail không được làm hỏng luồng chính của UI.
- Không tracking ngoài website, không browser fingerprinting, không theo dõi cross-site.

## Do Not Infer
- Không suy luận tính cách, tâm lý, chính trị, tôn giáo, sức khỏe hoặc tình trạng nhạy cảm.
- Không lưu dữ liệu riêng tư không cần thiết cho bài toán BĐS.
- Không bypass login, captcha, paywall hoặc quyền truy cập.
- Không dùng API hoặc dữ liệu chưa được cấp quyền.

## Allowed Sources
- Dữ liệu public được phép sử dụng.
- Dữ liệu do người dùng tự cung cấp.
- API chính thức được cấp quyền.
- Dữ liệu từ partner có thỏa thuận.
- Dữ liệu test/dev.

## Phase 13 Source Governance
- Mọi governed import phải gắn `DataSource`, permission type và permission note.
- Source `UNKNOWN` permission luôn inactive và không được import.
- Synthetic/dev source phải được đánh dấu `DEV_SYNTHETIC`.
- Không lưu credential, không kết nối API thật khi chưa được cấp quyền.
- Không bypass login, captcha, paywall hoặc quyền truy cập riêng tư.
- Không tự động liên hệ người dùng.
- Source import chỉ ghi raw data; normalized data phải sinh qua analysis pipeline.
- Frontend chỉ hiển thị governance fields được allowlist, không dump arbitrary metadata trực tiếp.

## Phase 14 Gemini External Behavior Rules
- Cho phép `DEV_SYNTHETIC` đi cùng `DEV_SYNTHETIC`, hoặc nguồn `FACEBOOK`/`WEBSITE`/`PARTNER_API`/`MANUAL_IMPORT`/`OTHER` đi cùng `AUTHORIZED_API`/`PARTNER_AGREEMENT`/`USER_SUBMITTED`.
- `PUBLIC_ALLOWED` hoặc public dataset không đủ cơ sở để liên kết hành vi cá nhân với tài khoản; hệ thống không tự crawler/scraper và không bypass quyền truy cập.
- External behavior raw payload luu trong MongoDB; admin phai link `externalUserRef` voi user HomeSense truoc khi phan tich.
- Email, so dien thoai va cac field PII pho bien duoc redact truoc khi gui Gemini.
- Gemini chi trich xuat hanh vi va tieu chi nhu cau BDS; khong suy luan tam ly, tinh cach, thuoc tinh nhay cam hoac rank recommendation.
- Structured output va confidence thap/khong lien quan BDS duoc dua ve review thay vi materialize tuy tien.
- Gemini timeout/error khong duoc lam login that bai.

## Storage Rules
- MongoDB lưu raw signal trong `RawUserSignal`.
- PostgreSQL lưu normalized demand trong `UserDemand`, `UserDemandSignal`, `DemandAnalysis`.
- PostgreSQL lưu kết quả matching trong `DemandPropertyMatch`.
- PostgreSQL lưu website behavior trong `UserBehaviorEvent`.
- PostgreSQL lưu preference BĐS tính toán trong `UserPreferenceProfile`.
- `externalUserRef` nên là reference hoặc hash khi có thể.
- Metadata phải được hiển thị an toàn, không render dữ liệu nhạy cảm bừa bãi.

## Canonical Learning And Raw Lifecycle
- Arbitrary external payload chỉ được materialize thành canonical signal thuộc allowlist BĐS.
- Location anchor chỉ dùng cho khu vực, nearby place hoặc nhu cầu di chuyển BĐS.
- Rule-based extraction và cache phải chạy trước Gemini; PII phổ biến được redact trước provider request.
- Raw success được xóa sau materialization; raw failed/review-required được giữ để audit/retry.
- User có API export/xóa normalized real-estate learning data.
