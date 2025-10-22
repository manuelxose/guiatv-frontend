// src/v2/presentation/middlewares/validator.ts

import { Request, Response, NextFunction } from 'express';
import { ValidationError, ValidationErrorDetail } from '../../shared/errors';
import { DateUtils } from '../../shared/utils/dateUtils';

export const validateDateParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { date } = req.params;

  if (!date) {
    throw new ValidationError('Date parameter is required', [
      {
        field: 'date',
        message: 'Date parameter is required',
      },
    ]);
  }

  try {
    DateUtils.parseDateAlias(date);
    next();
  } catch (error) {
    throw new ValidationError('Invalid date format', [
      {
        field: 'date',
        message:
          'Expected YYYYMMDD format or alias (today, tomorrow, after_tomorrow)',
        value: date,
      },
    ]);
  }
};

export const validateChannelIdParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { channelId, id } = req.params;
  const channelIdentifier = channelId || id;

  if (!channelIdentifier || channelIdentifier.trim() === '') {
    throw new ValidationError('Channel ID is required', [
      {
        field: 'channelId',
        message: 'Channel ID parameter is required and cannot be empty',
      },
    ]);
  }

  next();
};

export const validatePaginationQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { limit, offset } = req.query;
  const errors: ValidationErrorDetail[] = [];

  if (limit !== undefined) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      errors.push({
        field: 'limit',
        message: 'Limit must be a number between 1 and 1000',
        value: limit,
      });
    }
  }

  if (offset !== undefined) {
    const offsetNum = parseInt(offset as string, 10);
    if (isNaN(offsetNum) || offsetNum < 0) {
      errors.push({
        field: 'offset',
        message: 'Offset must be a non-negative number',
        value: offset,
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid pagination parameters', errors);
  }

  next();
};

export const validateTimeQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { fromTime, toTime } = req.query;
  const errors: ValidationErrorDetail[] = [];
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

  if (fromTime && !timeRegex.test(fromTime as string)) {
    errors.push({
      field: 'fromTime',
      message: 'Time must be in HH:mm format (00:00 to 23:59)',
      value: fromTime,
    });
  }

  if (toTime && !timeRegex.test(toTime as string)) {
    errors.push({
      field: 'toTime',
      message: 'Time must be in HH:mm format (00:00 to 23:59)',
      value: toTime,
    });
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid time parameters', errors);
  }

  next();
};
