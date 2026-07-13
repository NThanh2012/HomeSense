# Backend Structure

Backend nam trong `server/` va dung NestJS.

## Main Folders

- `server/src/modules`: business modules.
- `server/src/common`: decorators, DTO response, guards, filters, pipes, constants.
- `server/src/database/prisma`: Prisma schema, migrations, Prisma service.
- `server/src/database/mongoose`: Mongoose connection va raw schemas.
- `server/src/shared/utils`: rule-based parser, matcher, preference calculator.
- `server/test`: test root rieng; khong dat `*.spec.ts` trong `server/src`.

## Active AppModule Modules

`server/src/app.module.ts` dang import cac module runtime chinh:

- `HealthModule`
- `PropertiesModule`
- `UsersModule`
- `AuthModule`
- `FavoritesModule`
- `InquiriesModule`
- `AdminModule`
- `UserSignalsModule`
- `UserDemandsModule`
- `DemandAnalysisModule`
- `RecommendationsModule`
- `UserBehaviorsModule`
- `UserPreferencesModule`
- `DataSourcesModule`
- `SourceImportsModule`
- `ExternalBehaviorsModule`
- `UserLearningModule`
- `LearningJobsModule`

`RawPostsModule` va `PropertyAnalysisModule` van duoc giu trong source de tuong thich/audit,
nhung khong duoc import vao `AppModule`, `AdminModule` hoac `SourceImportsModule`.

Scaffold comment-only va empty class khong duoc giu trong `server/src`; module chi duoc tao khi co runtime contract ro rang.

## Module Pattern

Module moi nen giu cau truc don gian:

```txt
<module>/
  dto/
  entities/
  <module>.controller.ts
  <module>.service.ts
  <module>.module.ts
```

Module MongoDB co the co them `schemas/`.

## Backend Style

- Controller mong: nhan DTO/query/param, goi service, tra `ApiResponse.success(result)`.
- DTO dung `class-validator`, validation message viet tieng Viet.
- Business error dung `ApiException` + `ResponseCode`.
- Internal import dung duoi `.ts`.
- Indent 4 spaces.

## Auth/Admin Rules

- User route dung `TokenGuard` va `@CurrentUser()`.
- Admin route dung `TokenGuard`, `RolesGuard` va `@Roles(UserRole.ADMIN)`.
- Khong them permission model phuc tap neu phase chua yeu cau.

## Test Layout

Backend runtime code trong `server/src` khong chua `*.spec.ts`.
Neu bo sung test moi, dat trong `server/test` va import runtime code tu `server/src`.
Hien tai spec files da duoc xoa theo yeu cau cleanup; `corepack pnpm test` chay voi `--passWithNoTests`.

## Phase 12 Hybrid Ranking

Backend co them:

- hybrid ranking util cho base match, preference boost, feedback boost, freshness boost va status penalty.

Recommendation Evaluation da duoc loai bo de giu module recommendations gon.

## Phase 13 Authorized Source Governance

- `data-sources`: quan ly nguon va permission trong PostgreSQL.
- `source-imports`: tao batch/record audit va dieu phoi import raw MongoDB.
- Import chay dong bo, tuan tu, toi da 50 records; khong queue/microservice.
- Scaffold cu `social-sources`/`ingestion-batches` da duoc xoa; runtime dung `data-sources`/`source-imports`.

## Phase 15-21 Learning Core

- `user-learning`: canonical signal materialization, multi-intent, location anchor va normalized data export/delete.
- `learning-jobs`: PostgreSQL job claim/lease/retry/dedupe va in-process worker.
- `external-behaviors`: rule-based/cache extraction truoc Gemini fallback, raw success cleanup va failed/review retention.
- `recommendations`: unified list, intent/context/feature/time-decay score breakdown.
- Login khong goi Gemini; chi queue/promote background job.
