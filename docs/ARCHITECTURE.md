# Architecture

HomeSense hien la modular monolith don gian.

## Runtime Shape

- Frontend NextJS nam trong `client/` (package name `web`).
- Backend NestJS nam trong `server/` (package name `api`).
- MongoDB + Mongoose luu raw data.
- PostgreSQL + Prisma luu normalized/business data.
- API response dung chung `ApiResponse.success(result)` va `HttpExceptionFilter`.

## Core Data Flow

```txt
Authenticated seller
  -> tu nhap structured property form
  -> Property DRAFT (PostgreSQL)
  -> PENDING_REVIEW
  -> admin PUBLISHED
```

`RawPost` va `PropertyAnalysis` chi con la legacy schema/module de audit. Cac module nay
khong duoc mount trong `AppModule` va khong duoc tao `Property` moi.

```txt
RawUserSignal (MongoDB)
  -> demand-analysis
  -> UserDemand / UserDemandSignal / DemandAnalysis (PostgreSQL)
```

```txt
UserDemand + Property
  -> recommendations
  -> DemandPropertyMatch
  -> user recommendation feedback
  -> UserBehaviorEvent
  -> UserPreferenceProfile
  -> behavior-boosted recommendations
```

```txt
Governed DEV or authorized social/partner source import
  -> RawExternalBehavior (MongoDB)
  -> ExternalUserLink
  -> duplicate/relevance/rule-based/cache
  -> Gemini fallback cho payload kho
  -> ExternalBehaviorAnalysis / canonical UserPreferenceSignal / UserRealEstateIntent
  -> PostgreSQL LearningJob
  -> recommendation recompute
```

## Backend Boundaries

- Architecture giu theo luong `Controller -> DTO -> Service -> DB`.
- Business logic nam trong service hoac shared util nho.
- Route user dung `TokenGuard` va `@CurrentUser()`.
- Route admin dung `TokenGuard`, `RolesGuard` va `@Roles(UserRole.ADMIN)`.
- Khong dung CQRS, commands/queries/handlers, queue chuyen dung hoac microservice.
- Background work dung PostgreSQL DB job runner trong cung NestJS modular monolith.

## Data Ownership

- MongoDB luu `RawUserSignal`, `RawExternalBehavior` va `RawPost` legacy.
- PostgreSQL luu data da chuan hoa va nghiep vu user.
- `Property` moi chi sinh tu seller structured form; user signal, external behavior va Gemini khong tao property.
- `UserDemand` sinh qua demand-analysis pipeline.
- `DemandPropertyMatch` sinh qua recommendation/matching service.
- `UserBehaviorEvent` ghi hanh vi BDS trong website hoac external behavior tu governed source da duoc link va phan tich.

## Current Learning Architecture

- Website behavior materialize canonical signal ngay, khong can Gemini.
- Login chi enqueue/promote job va doc recommendation da luu; khong cho provider.
- Strong behavior queue recompute uu tien cao; weak views duoc gom toi 5 phut.
- Signal cu chi tinh time decay khi co recompute do thay doi; neu khong co thay doi, stored score/order giu nguyen.
- Gemini chi trich xuat tieu chi BDS co cau truc; unified ranking van rule-based trong he thong.

## Current Phase Notes

- Phase 11 da co recommendation feedback + user behavior learning loop rule-based.
- Backend spec files khong nam trong `server/src`; test root rieng la `server/test` va hien chua co test suites.
- Phase 12 da co Hybrid Ranking v1.
- Recommendation Evaluation da duoc loai bo de giu kien truc gon.
- Phase 13 source import hien chi nhan `USER_SIGNAL` va `EXTERNAL_BEHAVIOR`; `PROPERTY_POST` la legacy target bi tu choi.
- Source governance/audit nằm trong PostgreSQL; raw content và ingest metadata nằm trong MongoDB.
- Không có transaction xuyên MongoDB/PostgreSQL; retry dựa trên duplicate-skip idempotency.
