# API Response Rules

## Success
- Thành công luôn dùng:

```ts
return ApiResponse.success(result);
```

- Response thành công có dạng:

```json
{
    "code": "0000",
    "message": "Success",
    "data": {}
}
```

## Business Error
- Lỗi nghiệp vụ dùng:

```ts
throw new ApiException(ResponseCode.SOME_CODE, 'Message');
```

- Không dùng `throw new Error()` cho lỗi nghiệp vụ.
- Không tự return object lỗi thủ công.

## Exception Filter
- `HttpExceptionFilter` chuẩn hóa lỗi về:

```json
{
    "code": "string",
    "message": "string"
}
```

- Validation thiếu trường nên dùng message có chữ `trống`.
- Filter dùng chữ `trống` để map sang missing parameter.
