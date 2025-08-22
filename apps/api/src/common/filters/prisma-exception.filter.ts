import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@repo/db';
import { Response } from 'express';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        status = HttpStatus.CONFLICT;
        const target = exception.meta?.target as string[];

        if (target && target.includes('phone')) {
          message = 'Record with this phone number already exists';
        } else if (target && target.includes('email')) {
          message = 'Record with this email already exists';
        } else {
          message = 'This record already exists';
        }
        break;

      case 'P2025': // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      case 'P2003': // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference to related record';
        break;

      case 'P2014': // Required relation is missing
        status = HttpStatus.BAD_REQUEST;
        message = 'Required relation is missing';
        break;

      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database error occurred';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: this.getErrorName(status),
    });
  }

  private getErrorName(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      default:
        return 'Internal Server Error';
    }
  }
}
