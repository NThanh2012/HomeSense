# Module Naming Rules

## General

- Module folder names use kebab-case.
- Plural names are used for collection/business resources.
- Singular descriptive names are used for analysis or domain workflow modules.
- Do not introduce CQRS folders such as `commands`, `queries`, `handlers`, or `events`.

## Current Runtime Modules

Runtime modules imported by `AppModule` include:

- `health`
- `raw-posts`
- `property-analysis`
- `properties`
- `users`
- `auth`
- `favorites`
- `inquiries`
- `admin`
- `user-signals`
- `user-demands`
- `demand-analysis`
- `recommendations`
- `user-behaviors`
- `user-preferences`
- `data-sources`
- `source-imports`
- `external-behaviors`
- `user-learning`
- `learning-jobs`

## Naming Examples

- Data/resource modules: `users`, `properties`, `raw-posts`, `favorites`, `inquiries`.
- Analysis/workflow modules: `property-analysis`, `demand-analysis`.
- User demand modules: `user-signals`, `user-demands`.
- Recommendation/learning modules: `recommendations`, `user-behaviors`, `user-preferences`.
- Source governance modules: `data-sources`, `source-imports`.
- External behavior learning module: `external-behaviors`.

## Notes

- Khong tao hoac giu module scaffold comment-only/empty-class. Chi tao module khi co runtime contract ro rang.
- Source governance runtime dung `data-sources` va `source-imports`.
- New modules should match existing NestJS naming: `<module>.controller.ts`, `<module>.service.ts`, `<module>.module.ts`.
