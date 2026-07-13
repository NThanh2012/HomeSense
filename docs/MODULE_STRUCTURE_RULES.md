# Module Structure Rules

- Mỗi module NestJS dùng cấu trúc đơn giản:
    - `dto/`
    - `entities/`
    - `<module>.controller.ts`
    - `<module>.service.ts`
    - `<module>.module.ts`
- Module dùng MongoDB thì thêm:
    - `schemas/`
- Không tạo các folder sau trong phase này:
    - `commands/`
    - `queries/`
    - `handlers/`
    - `events/`

## Example

```txt
properties/
  dto/
  entities/
  properties.controller.ts
  properties.service.ts
  properties.module.ts
```

## Rule
- Controller chỉ xử lý HTTP request/response.
- Service xử lý business logic.
- DTO mô tả input/output.
- Entity dùng để mô tả shape dữ liệu domain nếu cần.
- Schema chỉ dùng cho Mongoose/MongoDB.
