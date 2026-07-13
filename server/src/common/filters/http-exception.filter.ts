import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiException } from '../exceptions/api.exception.ts';
import { ResponseCode } from '../constants/response-code.constant.ts';

interface HttpExceptionResponse {
    message?: string | string[];
    code?: ResponseCode;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = ResponseCode.EXCEPTION_ERROR;
        let message = 'Exception error';

        if (exception instanceof ApiException) {
            status = exception.getStatus();
            code = exception.code;
            message = exception.message;
        } else if (exception instanceof BadRequestException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse() as HttpExceptionResponse;
            let validationMessage = exceptionResponse.message ?? 'Bad Request';

            if (Array.isArray(validationMessage)) {
                validationMessage = validationMessage[0];
            }

            code = ResponseCode.INVALID_PARAMETER_VALUE;
            message = String(validationMessage);

            if (message.includes('trống')) {
                code = ResponseCode.MISSING_PARAMETER;
            }
        } else if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.message;

            const exceptionResponse = exception.getResponse() as HttpExceptionResponse;
            if (exceptionResponse && typeof exceptionResponse === 'object' && exceptionResponse.code) {
                code = exceptionResponse.code;
            }
        } else if (
            exception instanceof Prisma.PrismaClientKnownRequestError ||
            exception instanceof Prisma.PrismaClientUnknownRequestError ||
            exception instanceof Prisma.PrismaClientInitializationError ||
            exception instanceof Prisma.PrismaClientRustPanicError
        ) {
            status = HttpStatus.OK;
            code = ResponseCode.CAN_NOT_CONNECT;
            message = 'Can not connect to DB';
        }

        response.status(status).json({
            code: code,
            message: message,
        });
    }
}
