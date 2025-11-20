"use strict";
// src/v2/presentation/middlewares/validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTimeQuery = exports.validatePaginationQuery = exports.validateChannelIdParam = exports.validateDateParam = void 0;
const errors_1 = require("../../shared/errors");
const dateUtils_1 = require("../../shared/utils/dateUtils");
const validateDateParam = (req, res, next) => {
    const { date } = req.params;
    if (!date) {
        throw new errors_1.ValidationError('Date parameter is required', [
            {
                field: 'date',
                message: 'Date parameter is required',
            },
        ]);
    }
    try {
        dateUtils_1.DateUtils.parseDateAlias(date);
        next();
    }
    catch (error) {
        throw new errors_1.ValidationError('Invalid date format', [
            {
                field: 'date',
                message: 'Expected YYYYMMDD format or alias (today, tomorrow, after_tomorrow)',
                value: date,
            },
        ]);
    }
};
exports.validateDateParam = validateDateParam;
const validateChannelIdParam = (req, res, next) => {
    const { channelId, id } = req.params;
    const channelIdentifier = channelId || id;
    if (!channelIdentifier || channelIdentifier.trim() === '') {
        throw new errors_1.ValidationError('Channel ID is required', [
            {
                field: 'channelId',
                message: 'Channel ID parameter is required and cannot be empty',
            },
        ]);
    }
    next();
};
exports.validateChannelIdParam = validateChannelIdParam;
const validatePaginationQuery = (req, res, next) => {
    const { limit, offset } = req.query;
    const errors = [];
    if (limit !== undefined) {
        const limitNum = parseInt(limit, 10);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
            errors.push({
                field: 'limit',
                message: 'Limit must be a number between 1 and 1000',
                value: limit,
            });
        }
    }
    if (offset !== undefined) {
        const offsetNum = parseInt(offset, 10);
        if (isNaN(offsetNum) || offsetNum < 0) {
            errors.push({
                field: 'offset',
                message: 'Offset must be a non-negative number',
                value: offset,
            });
        }
    }
    if (errors.length > 0) {
        throw new errors_1.ValidationError('Invalid pagination parameters', errors);
    }
    next();
};
exports.validatePaginationQuery = validatePaginationQuery;
const validateTimeQuery = (req, res, next) => {
    const { fromTime, toTime } = req.query;
    const errors = [];
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (fromTime && !timeRegex.test(fromTime)) {
        errors.push({
            field: 'fromTime',
            message: 'Time must be in HH:mm format (00:00 to 23:59)',
            value: fromTime,
        });
    }
    if (toTime && !timeRegex.test(toTime)) {
        errors.push({
            field: 'toTime',
            message: 'Time must be in HH:mm format (00:00 to 23:59)',
            value: toTime,
        });
    }
    if (errors.length > 0) {
        throw new errors_1.ValidationError('Invalid time parameters', errors);
    }
    next();
};
exports.validateTimeQuery = validateTimeQuery;
//# sourceMappingURL=validator.js.map