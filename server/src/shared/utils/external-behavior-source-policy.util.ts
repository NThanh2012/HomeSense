import { DataPermissionType, DataSourceType } from '@prisma/client';

export const PRODUCTION_EXTERNAL_BEHAVIOR_SOURCE_TYPES = [
    DataSourceType.FACEBOOK,
    DataSourceType.WEBSITE,
    DataSourceType.PARTNER_API,
    DataSourceType.MANUAL_IMPORT,
    DataSourceType.OTHER,
] as const;

export const PRODUCTION_EXTERNAL_BEHAVIOR_PERMISSION_TYPES = [
    DataPermissionType.AUTHORIZED_API,
    DataPermissionType.PARTNER_AGREEMENT,
    DataPermissionType.USER_SUBMITTED,
] as const;

export const EXTERNAL_BEHAVIOR_SOURCE_POLICY_MESSAGE =
    'Hành vi ngoài hệ thống chỉ nhận nguồn social/partner được cấp quyền API, có thỏa thuận đối tác hoặc do chính người dùng cung cấp; nguồn DEV_SYNTHETIC phải dùng quyền DEV_SYNTHETIC';

export function isExternalBehaviorSourceAllowed(
    sourceType: DataSourceType,
    permissionType: DataPermissionType,
) {
    if (
        sourceType === DataSourceType.DEV_SYNTHETIC ||
        permissionType === DataPermissionType.DEV_SYNTHETIC
    ) {
        return (
            sourceType === DataSourceType.DEV_SYNTHETIC &&
            permissionType === DataPermissionType.DEV_SYNTHETIC
        );
    }

    return (
        PRODUCTION_EXTERNAL_BEHAVIOR_SOURCE_TYPES.some((type) => type === sourceType) &&
        PRODUCTION_EXTERNAL_BEHAVIOR_PERMISSION_TYPES.some(
            (type) => type === permissionType,
        )
    );
}
