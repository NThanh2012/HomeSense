# FRONTEND DESIGN PLAN — HomeSense

> Current override (12/07/2026): seller structured form la UI duy nhat duoc tao tin BDS.
> Cac section `/admin/raw-posts*` ben duoi chi la lich su thiet ke, khong con route/runtime contract.
> Source import hien chi phuc vu `USER_SIGNAL` va `EXTERNAL_BEHAVIOR`.

## 1. Mục tiêu thiết kế frontend

Frontend của HomeSense cần ưu tiên 4 mục tiêu:

1. **Dễ dùng**: người dùng vào là xem được danh sách bất động sản, lọc, xem chi tiết, đăng nhập và lưu tin.
2. **Dễ mở rộng**: mỗi nhóm chức năng nằm trong `features/`, UI tách thành component nhỏ.
3. **Bám sát API backend**: không mock lung tung khi backend đã có API thật.
4. **Đơn giản cho giai đoạn đầu**: chưa dùng UI library lớn như Tailwind, shadcn, MUI nếu chưa cần.

Frontend hiện tại nên đi theo hướng:

```txt
Property-first UI
  -> Auth cơ bản
  -> User dashboard
  -> Favorites/Inquiries
  -> Admin/Data Management
  -> Search/UX nâng cao
```

---

## 2. Nguyên tắc thiết kế tổng thể

### 2.1. Thiết kế theo luồng người dùng

Không thiết kế frontend theo kiểu “có trang nào làm trang đó”, mà đi theo luồng:

```txt
Người xem:
Trang chủ -> Danh sách BĐS -> Chi tiết BĐS -> Đăng nhập -> Lưu tin/Gửi liên hệ

Người dùng đã đăng nhập:
Login -> Dashboard -> Tin đã lưu -> Yêu cầu liên hệ -> Hồ sơ cá nhân

Admin:
Login -> Admin dashboard -> Raw posts -> Analyze -> Properties -> Inquiries
```

### 2.2. Không làm UI quá phức tạp sớm

Giai đoạn này chưa cần:

```txt
Animation phức tạp
Map/GIS
Chat real-time
Notification
Upload ảnh
Dashboard chart nâng cao
UI library lớn
```

Ưu tiên:

```txt
Rõ ràng
Responsive
Dễ đọc
Dễ bảo trì
Ít dependency
```

---

## 3. Cấu trúc frontend đề xuất

Toàn bộ frontend nằm trong:

```txt
mobile/src/
```

Cấu trúc chính:

```txt
mobile/src/
  app/
    page.tsx
    properties/
      page.tsx
      [id]/
        page.tsx
    auth/
      login/
        page.tsx
      register/
        page.tsx
    dashboard/
      page.tsx
      profile/
        page.tsx
      favorites/
        page.tsx
      inquiries/
        page.tsx
    admin/
      page.tsx
      properties/
        page.tsx
        [id]/
          page.tsx
      raw-posts/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
        import/
          page.tsx
      inquiries/
        page.tsx

  components/
    common/
    layout/
    properties/
    auth/
    dashboard/
    favorites/
    inquiries/
    admin/

  features/
    auth/
    users/
    properties/
    favorites/
    inquiries/
    admin/
    admin-raw-posts/

  lib/
    api-client.ts
    constants.ts
    formatters.ts
    utils.ts

  types/
    api-response.type.ts
```

---

## 4. Quy tắc chia folder

### 4.1. `app/`

Chỉ chứa route/page/layout.

Ví dụ:

```txt
mobile/src/app/properties/page.tsx
```

Nhiệm vụ:

* Nhận search params.
* Gọi API wrapper từ `features/`.
* Truyền dữ liệu xuống component.
* Không viết logic UI quá dài trong page.

Không nên để toàn bộ UI trong page.

---

### 4.2. `components/`

Chứa component hiển thị.

Ví dụ:

```txt
components/properties/PropertyCard.tsx
components/properties/PropertyList.tsx
components/common/Loading.tsx
components/common/ErrorState.tsx
components/common/EmptyState.tsx
```

Component nên:

* Nhận props rõ ràng.
* Không tự gọi API nếu không cần.
* Không chứa business logic phức tạp.
* Có thể tái sử dụng ở nhiều page.

---

### 4.3. `features/`

Chứa logic theo domain.

Ví dụ:

```txt
features/properties/properties.api.ts
features/properties/properties.types.ts
```

Quy tắc:

* API call đặt trong `*.api.ts`.
* Type riêng của feature đặt trong `*.types.ts`.
* Page/component không gọi `fetch` trực tiếp nếu đã có API wrapper.
* Tất cả API wrapper phải dùng `mobile/src/lib/api-client.ts`.

---

### 4.4. `lib/`

Chứa code dùng chung:

```txt
api-client.ts
formatters.ts
constants.ts
utils.ts
```

Ví dụ `formatters.ts` nên có:

```txt
formatPrice()
formatArea()
formatPropertyType()
formatTransactionType()
formatDate()
```

---

## 5. Design style

### 5.1. Giao diện tổng thể

Phong cách nên là:

```txt
Sạch
Sáng
Rõ thông tin
Tập trung vào nội dung bất động sản
Ít màu nhưng có điểm nhấn
```

Màu gợi ý:

```txt
Primary: xanh dương hoặc xanh lá đậm
Background: trắng / xám rất nhạt
Text chính: gần đen
Text phụ: xám
Danger: đỏ
Success: xanh lá
Warning: cam
```

Không cần design quá màu mè.

---

### 5.2. Layout chính

Nên có các layout:

```txt
MainLayout
DashboardLayout
AdminLayout
```

#### MainLayout

Dùng cho:

```txt
/
/properties
/properties/[id]
/auth/login
/auth/register
```

Có:

```txt
Header
Main content
Footer
```

#### DashboardLayout

Dùng cho:

```txt
/dashboard
/dashboard/profile
/dashboard/favorites
/dashboard/inquiries
```

Có:

```txt
Sidebar
Header nhỏ
Content area
```

#### AdminLayout

Dùng cho:

```txt
/admin
/admin/properties
/admin/raw-posts
/admin/inquiries
```

Có:

```txt
Admin sidebar
Admin header
Content table/detail
```

---

## 6. Thiết kế các nhóm trang chính

## 6.1. Public property pages

### `/properties`

Mục tiêu:

* Hiển thị danh sách bất động sản.
* Cho phép lọc cơ bản.
* Có pagination.
* Có empty/error/loading state.

Cần có component:

```txt
PropertyFilter
PropertyList
PropertyCard
Pagination
Loading
ErrorState
EmptyState
```

Property card nên hiển thị:

```txt
Ảnh
Tiêu đề
Giá
Diện tích
Loại giao dịch
Loại BĐS
Địa chỉ
Nút xem chi tiết
```

---

### `/properties/[id]`

Mục tiêu:

* Hiển thị chi tiết bất động sản.
* Có thông tin phân tích.
* Có nút lưu tin và form liên hệ ở phase sau.

Cần có component:

```txt
PropertyDetail
PropertyMediaGallery
PropertyInfo
PropertyAnalysisBox
FavoriteButton
InquiryForm
```

Trong phase chưa có favorite/inquiry thì để placeholder hoặc ẩn.

---

## 6.2. Auth pages

### `/auth/login`

Mục tiêu:

* User đăng nhập.
* Lưu token vào localStorage.
* Điều hướng về trang trước hoặc dashboard.

Component:

```txt
LoginForm
```

### `/auth/register`

Mục tiêu:

* User đăng ký.
* Sau khi đăng ký có thể tự login hoặc chuyển sang login.

Component:

```txt
RegisterForm
```

Auth UI cần:

* Validate form cơ bản.
* Hiển thị lỗi API.
* Không hiển thị lỗi thô khó hiểu.

---

## 6.3. User dashboard

### `/dashboard`

Mục tiêu:

* Tổng quan tài khoản.
* Shortcut đến profile, favorites, inquiries.

Component:

```txt
DashboardStatCard
DashboardShortcut
```

### `/dashboard/profile`

Mục tiêu:

* Xem/sửa thông tin cá nhân.
* Gọi `GET /users/me`.
* Gọi `PATCH /users/me`.

Component:

```txt
ProfileForm
```

### `/dashboard/favorites`

Mục tiêu:

* Hiển thị property đã lưu.
* Cho phép bỏ lưu.

Component:

```txt
FavoritePropertyList
FavoritePropertyCard
```

### `/dashboard/inquiries`

Mục tiêu:

* Hiển thị inquiry user đã gửi.
* Hiển thị trạng thái inquiry.

Component:

```txt
InquiryList
InquiryStatusBadge
```

---

## 6.4. Admin pages

### `/admin`

Mục tiêu:

* Tổng quan dữ liệu hệ thống.
* Chỉ admin xem được.

Hiển thị:

```txt
Tổng properties
Tổng raw posts
Tổng inquiries
Tổng users nếu có
```

### `/admin/properties`

Mục tiêu:

* Admin xem danh sách property.
* Đổi trạng thái property.

Component:

```txt
AdminPropertyTable
AdminPropertyStatusSelect
```

### `/admin/raw-posts`

Mục tiêu:

* Admin xem raw posts.
* Vào detail để analyze/re-analyze.

Component:

```txt
AdminRawPostTable
```

### `/admin/raw-posts/new`

Mục tiêu:

* Admin nhập raw post thủ công.

Component:

```txt
AdminRawPostForm
```

### `/admin/raw-posts/import`

Mục tiêu:

* Admin import JSON đơn giản.

Component:

```txt
AdminRawPostImportJson
```

### `/admin/raw-posts/[id]`

Mục tiêu:

* Xem raw post detail.
* Bấm analyze.
* Xem analysis/property đã sinh.

Component:

```txt
AdminRawPostDetail
AdminAnalyzeButton
AdminAnalysisResult
```

---

## 7. Auth handling frontend

Hiện token lưu trong `localStorage`.

Giai đoạn này nên xử lý đơn giản:

```txt
auth-storage.ts
use-current-user.ts
AuthRequired.tsx
AdminRequired.tsx
```

### AuthRequired

Dùng cho dashboard:

```txt
Nếu không có token -> yêu cầu đăng nhập
Nếu token invalid -> xóa token, yêu cầu đăng nhập lại
Nếu có user -> render children
```

### AdminRequired

Dùng cho admin:

```txt
Nếu chưa login -> yêu cầu đăng nhập
Nếu không phải ADMIN -> hiển thị 403
Nếu là ADMIN -> render children
```

Không nên dùng Next middleware ngay nếu token vẫn lưu trong localStorage.

---

## 8. API design frontend

Frontend không gọi API trực tiếp bằng `fetch` trong component/page nếu đã có wrapper.

Ví dụ:

```txt
properties.api.ts
auth.api.ts
users.api.ts
favorites.api.ts
inquiries.api.ts
admin.api.ts
admin-raw-posts.api.ts
```

Tất cả dùng:

```txt
mobile/src/lib/api-client.ts
```

API client cần hỗ trợ:

```txt
GET
POST
PATCH
DELETE
Authorization Bearer token
ApiResponse<T>
Error handling
```

---

## 9. UI states bắt buộc

Mọi trang gọi API phải có:

```txt
Loading state
Error state
Empty state
Success state
Token invalid state nếu cần auth
No permission state nếu cần admin
```

Không để page trắng khi API lỗi.

---

## 10. Responsive design

Tối thiểu hỗ trợ:

```txt
Desktop
Tablet
Mobile
```

Quy tắc:

* Property cards trên desktop có thể dạng grid.
* Mobile chuyển về một cột.
* Dashboard/admin sidebar có thể chuyển thành top menu hoặc collapsed list.
* Table admin trên mobile có thể scroll ngang.

---

## 11. Format dữ liệu

Cần có formatter dùng chung:

```txt
formatPrice(value)
formatArea(value)
formatDate(value)
formatPropertyType(value)
formatTransactionType(value)
formatInquiryStatus(value)
```

Không format thủ công lặp lại trong từng component.

---

## 12. Thứ tự triển khai frontend đề xuất

### Phase FE-1: Public property UI

```txt
/properties
/properties/[id]
PropertyCard
PropertyList
PropertyDetail
PropertyFilter
```

### Phase FE-2: Auth UI

```txt
/auth/login
/auth/register
auth-storage
use-current-user
```

### Phase FE-3: Dashboard user

```txt
/dashboard
/dashboard/profile
/dashboard/favorites
/dashboard/inquiries
```

### Phase FE-4: Favorite + Inquiry interaction

```txt
FavoriteButton
InquiryForm
Favorite list
Inquiry list
```

### Phase FE-5: Admin UI cơ bản

```txt
/admin
/admin/properties
/admin/raw-posts
/admin/inquiries
```

### Phase FE-6: Manual ingestion UI

```txt
/admin/raw-posts/new
/admin/raw-posts/import
/admin/raw-posts/[id]
Analyze button
Analysis result
```

### Phase FE-7: Search/UX nâng cao

```txt
Filter sidebar
Sort
URL query sync
Better pagination
Better empty states
```

---

## 13. Những điều không nên làm sớm

Không nên làm sớm:

```txt
UI library lớn
Animation phức tạp
Realtime chat
Map nâng cao
Upload ảnh
Notification
Admin analytics phức tạp
Crawler UI
Multi-role permission phức tạp
```

Lý do:

* Dễ làm project phình to.
* Dễ lệch khỏi luồng chính.
* Người mới học NestJS/NextJS sẽ khó debug.

---

## 14. Tiêu chí frontend đạt yêu cầu

Frontend được coi là ổn khi:

```txt
web build pass
Không gọi fetch lung tung ngoài API wrapper
Có loading/error/empty state
Property list/detail chạy với API thật
Auth login/register chạy được
Dashboard chỉ cho user đăng nhập
Admin chỉ cho ADMIN
Không vỡ layout khi thiếu data
Responsive cơ bản
Không thêm dependency lớn không cần thiết
```

---

## 15. Quy tắc cho Codex khi code frontend

Khi Codex code frontend, phải tuân thủ:

```txt
Đọc AGENTS.md và docs trước.
Không tự đổi API contract.
Không tự thêm thư viện UI.
Không tự refactor backend nếu không cần.
Không gọi fetch trực tiếp nếu đã có API wrapper.
Không viết toàn bộ logic trong page.
Tách component nhỏ.
Dùng type rõ ràng.
Build phải pass sau mỗi phase.
```
