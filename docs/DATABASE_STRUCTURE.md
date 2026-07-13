# Database Structure

## MongoDB/Mongoose

MongoDB chi dung cho raw data.

Models hien co:

- `RawPost`: raw property post legacy, khong nhan record moi tu runtime seller-only.
- `RawUserSignal`: raw user demand signal.
- `RawExternalBehavior`: arbitrary governed external behavior payload chua phan tich.

`Property` moi chi duoc tao boi authenticated seller tu structured form trong PostgreSQL.
`RawPost`, source import, user signal, external behavior va Gemini khong duoc tao hoac sua `Property`.
`RawPost`/property-analysis schema va row cu duoc giu non-destructive cho audit.

## PostgreSQL/Prisma

PostgreSQL dung cho normalized data va nghiep vu user.

Models hien co:

- Property domain: `Property`, `Location`, `PropertyMedia`, `PropertyAnalysis`.
- User domain: `User`, `Favorite`, `Inquiry`.
- Demand domain: `UserDemand`, `UserDemandSignal`, `DemandAnalysis`.
- Recommendation domain: `DemandPropertyMatch`.
- Behavior learning domain: `UserBehaviorEvent`, `UserPreferenceProfile`.
- External behavior learning domain: `ExternalUserLink`, `ExternalBehaviorAnalysis`, behavior-derived `UserDemand`.
- Source governance domain: `DataSource`, `SourceImportBatch`, `SourceImportRecord`.
- Canonical learning domain: `UserPreferenceSignal`, `UserRealEstateIntent`, `IntentPreferenceSignal`, `UserLocationAnchor`.
- Background/cost domain: `LearningJob`, `LearningJobItem`, `RecommendationRecomputeJob`, `LlmExtractionCache`.
- Rich property domain bo sung `PropertyNearbyPlace` va feature fields tren `Property`/`PropertyAnalysis`.
- Seller-submitted property dung `Property.createdByUserId` lien ket ve `User`, status flow `DRAFT -> PENDING_REVIEW -> PUBLISHED`.

Enums hien co:

- `TransactionType`, `PropertyType`, `PropertyStatus`, `MediaType`.
- `UserRole`, `UserStatus`, `InquiryStatus`.
- `DemandType`, `UserDemandStatus`, `DemandMatchStatus`.
- `UserBehaviorEventType`.
- `DataSourceType`, `DataPermissionType`, `SourceImportType`, `SourceImportTargetType`, `SourceImportStatus`, `SourceImportRecordStatus`.
- `UserDemandOrigin`, `UserBehaviorSource`, `ExternalBehaviorAnalysisStatus`.

## Migrations

Prisma migrations hien co:

- `20260521000000_init`
- `20260529160000_add_users_auth`
- `20260530090633_add_favorites_inquiries`
- `20260530120000_add_user_demand_signals`
- `20260530154819_add_demand_property_match`
- `20260531100000_add_outdated_demand_match_status`
- `20260531113000_add_user_behavior_preferences`
- `20260606120000_add_authorized_source_governance`
- `20260611120000_add_external_behavior_llm_learning`
- `20260612132040_phase15_21_learning_core`
- `20260704130000_add_user_submitted_properties`
- `20260712090000_seller_only_property_default_draft`

## Current Phase Notes

- Phase 11 da them `UserBehaviorEvent` va `UserPreferenceProfile`.
- Phase 11 backend test coverage update khong doi Prisma schema, migration hoac database ownership.
- Phase 12 Hybrid Ranking khong them model hoac migration rieng.
- Phase 13 them source governance/audit trong PostgreSQL; raw payload van chi nam trong MongoDB.
- Phase 14 them external user linking, LLM analysis audit, event source/origin va preference stale metadata trong PostgreSQL.
- Phase 14 raw external payload van chi nam trong MongoDB; PostgreSQL chi luu ket qua BDS co cau truc va audit reference.
- Phase 15-21 them canonical signals/multi-intent, rich property features, DB jobs va LLM cache; migration da apply vao PostgreSQL Docker.
- Seller-submitted listing dung `PENDING_REVIEW`, owner relation va DB default `DRAFT`; migration can deploy khi PostgreSQL Docker dang chay.
