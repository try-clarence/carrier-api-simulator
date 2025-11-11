import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      // Handle validation errors from class-validator
      if (exception instanceof BadRequestException) {
        if (typeof exceptionResponse === 'object' && Array.isArray(exceptionResponse.message)) {
          // Validation pipe errors
          const validationErrors = exceptionResponse.message;

          errorResponse = {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Request validation failed',
              details: validationErrors,
            },
          };
        } else if (typeof exceptionResponse === 'object' && exceptionResponse.error) {
          // Already formatted error from our code
          errorResponse = {
            success: false,
            error: exceptionResponse.error,
          };
        } else {
          errorResponse = {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message:
                typeof exceptionResponse === 'string'
                  ? exceptionResponse
                  : exceptionResponse.message || 'Bad request',
            },
          };
        }
      } else if (typeof exceptionResponse === 'object' && exceptionResponse.error) {
        // Already formatted error from our services
        errorResponse = exceptionResponse as any;
      } else {
        // Other HTTP exceptions
        errorResponse = {
          success: false,
          error: {
            code: this.getErrorCode(status),
            message:
              typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exceptionResponse.message || 'An error occurred',
          },
        };
      }
    } else if (exception instanceof Error) {
      // Unhandled errors
      console.error('Unhandled error:', exception);
      const errorObj: any = {
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : exception.message,
      };

      if (process.env.NODE_ENV !== 'production') {
        errorObj.details = exception.stack;
      }

      errorResponse = {
        success: false,
        error: errorObj,
      };
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'INVALID_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.GONE:
        return 'QUOTE_EXPIRED';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_ERROR';
      default:
        return 'ERROR';
    }
  }
}
