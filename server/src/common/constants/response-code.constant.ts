export enum ResponseCode {
    OK = '0000',
    MISSING_PARAMETER = '1001',
    INVALID_PARAMETER_VALUE = '1002',
    RESOURCE_NOT_FOUND = '1003',
    CAN_NOT_CONNECT = '1004',
    EXCEPTION_ERROR = '9999',
}

export const ResponseMessage: Record<ResponseCode, string> = {
    [ResponseCode.OK]: 'Success',
    [ResponseCode.MISSING_PARAMETER]: 'Missing parameter',
    [ResponseCode.INVALID_PARAMETER_VALUE]: 'Invalid parameter value',
    [ResponseCode.RESOURCE_NOT_FOUND]: 'Resource not found',
    [ResponseCode.CAN_NOT_CONNECT]: 'Can not connect to DB',
    [ResponseCode.EXCEPTION_ERROR]: 'Exception error',
};
