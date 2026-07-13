# HomeSense

HomeSense la web mua ban bat dong san voi frontend NextJS trong `client/` package `web` va backend NestJS trong `server/` package `api`.

## Stack

- Frontend: NextJS App Router trong `client/`.
- Backend: NestJS modular monolith trong `server/`.
- Raw learning/audit data: MongoDB + Mongoose; `RawPost` cũ chỉ được giữ lại dạng legacy.
- Normalized/business data: PostgreSQL + Prisma.
- Package manager: pnpm.

## Current State

- Chi seller-submitted listing duoc tao `Property`: nguoi ban tu nhap day du form co cau truc, tao `DRAFT`, gui admin thanh `PENDING_REVIEW`, admin publish thanh `PUBLISHED`.
- Luong `raw-posts` -> `property-analysis` -> `properties` va cac API/UI nhap raw property post da bi vo hieu hoa; he thong khong tao tin BDS tu du lieu ben ngoai.
- Schema va row `RawPost`/`PropertyAnalysis` cu duoc giu lai khong pha huy de tuong thich va audit, nhung khong tao `Property` moi.
- Frontend da co property list/detail, auth, user dashboard va admin pages.
- Phase 7 raw-post ingestion la chuc nang lich su va hien da bi vo hieu hoa.
- Phase 8: search/filter/sort UX cho `/properties`.
- Phase 9: user demand signal ingestion va rule-based demand analysis.
- Phase 10: demand-property matching/recommendation voi `DemandPropertyMatch`.
- Phase 11: recommendation feedback + user behavior learning loop:
    - `UserBehaviorEvent`, `UserPreferenceProfile`,
    - `/user-behaviors`, `/user-preferences`, recommendation feedback/recompute APIs,
    - behavior boost nhe cho recommendation score,
    - frontend tracking trong website, khong tracking ngoai he thong.
- Phase 12: Hybrid Ranking v1 voi final score tu base match, preference, feedback, freshness va status penalty.
- Phase 13: Authorized Source Integration + Data Governance:
    - `DataSource`, `SourceImportBatch`, `SourceImportRecord`,
    - import JSON co kiem soat chi con cho `RawUserSignal`/`RawExternalBehavior`; `PROPERTY_POST` khong con duoc chap nhan,
    - duplicate governed import duoc `SKIPPED`, khong ghi de raw evidence,
    - admin UI cho data sources va source imports.
- Phase 14: Gemini-assisted external behavior learning loop:
    - nhan external behavior qua governed source import tu DEV hoac social/partner source co API, thoa thuan hoac user consent hop le,
    - raw arbitrary JSON luu trong MongoDB `RawExternalBehavior`,
    - admin link va bat/tat `externalUserRef` voi tai khoan HomeSense,
    - external payload linh hoat duoc luu trong MongoDB va materialize thanh BDS signals co cau truc.
- Phase 15-21 backend-first learning core:
    - canonical `UserPreferenceSignal`, multi-intent `UserRealEstateIntent`, `UserLocationAnchor`,
    - rich property features va unified hybrid ranking co event-driven time decay,
    - PostgreSQL `LearningJob` runner co lease/retry/dedupe; login chi queue/promote job, khong cho Gemini,
    - rule-based extraction + cache truoc, Gemini chi fallback cho payload kho,
    - admin skeleton cho learning jobs/external behaviors/user intents,
    - public property metadata, sitemap, robots va JSON-LD.

## Main Backend APIs

- Public properties: `GET /properties`, `GET /properties/:id`.
- Auth/users: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /users/me`, `PATCH /users/me`.
- User features: favorites, inquiries, recommendations, user behaviors, user preferences.
- Admin: overview, properties, inquiries, user signals, user demands, demand analysis, recommendations va learning jobs; khong con raw-property ingestion.
- Seller properties: `POST /properties/me`, `GET /properties/me`, `GET /properties/me/:id`, `PATCH /properties/me/:id`, `PATCH /properties/me/:id/submit`.

## Current Boundaries

- Chua lam notification, payment, crawler/scraper, queue chuyen dung, microservice hoac CQRS.
- Gemini Phase 14 chi trich xuat tieu chi BDS tu governed external behavior khi rule/cache khong du; khong rank recommendation va khong suy luan du lieu nhay cam.
- Chua co crawler/scraper, connector API that hoac queue import.
- Khong goi user demand analysis hoac behavior learning la personality profiling.
- MongoDB chi luu raw learning/audit data; PostgreSQL luu normalized/business data. Legacy `RawPost` rows khong bi xoa tu dong.
- Chi seller structured form duoc tao `Property`; `RawPost`, `property-analysis`, import JSON, `USER_SIGNAL`, `EXTERNAL_BEHAVIOR` va Gemini khong duoc tao tin BDS.
- `USER_SIGNAL` va `EXTERNAL_BEHAVIOR` van co the phuc vu hoc nhu cau/recommendation trong pham vi du lieu BDS.

## Cai Dependencies

```bash
pnpm install
```

Neu may chua nhan `pnpm`, dung Corepack:

```bash
corepack pnpm install
```

## Bat Database Local

Docker Compose nam trong `infra/docker-compose.yml`.

```bash
docker compose -f infra/docker-compose.yml up -d
```

PostgreSQL map ra host port `5433`; MongoDB dung port local `27017`.

Env mau:

```env
DATABASE_URL="postgresql://support_bds:support_bds@localhost:5433/support_bds?schema=public"
MONGODB_URI="mongodb://localhost:27017/support_bds_raw"
API_PORT=3001
NODE_ENV=development
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-3.5-flash"
```

## Prisma

```bash
cd server
corepack pnpm prisma:generate
corepack pnpm prisma:migrate:deploy
```

## Chay Local

```bash
cd server
corepack pnpm start:dev

cd ../client
corepack pnpm dev
```

API mac dinh:

```txt
http://localhost:3001
```

## Verify

```bash
cd server
corepack pnpm build

cd ../client
corepack pnpm build
```

Verify gan nhat:

- `corepack pnpm prisma:generate` trong `server/`: passed.
- `corepack pnpm build` trong `server/`: passed.
- `corepack pnpm exec tsc --noEmit` trong `client/`: passed.
- `corepack pnpm build` trong `client/`: passed; remote `next/font` da duoc loai bo.
- Toan bo 12 Prisma migrations, gom `20260712090000_seller_only_property_default_draft`, da deploy vao PostgreSQL Docker local.
