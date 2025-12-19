import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../../infrastructure/database/models/User.model';
import { successResponse } from '../../shared/types/ApiResponse';
import { NotFoundError, ValidationError } from '../../shared/errors';

const ROLES = new Set(['admin', 'editor', 'user']);
const STATUSES = new Set(['active', 'suspended']);

export class AdminUsersController {
  async listUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { search, role, status, page, limit } = req.query;
      const filters: Record<string, any> = {};

      if (search && typeof search === 'string') {
        const regex = new RegExp(search, 'i');
        filters.$or = [{ email: regex }, { name: regex }];
      }

      if (role && typeof role === 'string' && ROLES.has(role)) {
        filters.role = role;
      }

      if (status && typeof status === 'string' && STATUSES.has(status)) {
        filters.status = status;
      }

      const limitValue = this.parseNumber(limit, 20, 1, 100);
      const pageValue = this.parseNumber(page, 1, 1, 1000);
      const skip = (pageValue - 1) * limitValue;

      const [users, total] = await Promise.all([
        UserModel.find(filters)
          .sort({ lastLoginAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limitValue)
          .lean()
          .exec(),
        UserModel.countDocuments(filters),
      ]);

      const pages = Math.max(1, Math.ceil(total / limitValue));

      res.json(
        successResponse({
          users: users.map((user) => this.mapUser(user)),
          pagination: {
            total,
            page: pageValue,
            limit: limitValue,
            pages,
          },
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { role, status } = req.body || {};

      const updates: Record<string, any> = {};
      const details: Array<{ field: string; message: string; value: any }> = [];

      if (role !== undefined) {
        if (typeof role !== 'string' || !ROLES.has(role)) {
          details.push({ field: 'role', message: 'Invalid role', value: role });
        } else {
          updates.role = role;
        }
      }

      if (status !== undefined) {
        if (typeof status !== 'string' || !STATUSES.has(status)) {
          details.push({
            field: 'status',
            message: 'Invalid status',
            value: status,
          });
        } else {
          updates.status = status;
        }
      }

      if (details.length) {
        throw new ValidationError('Invalid update payload', details);
      }

      if (!Object.keys(updates).length) {
        throw new ValidationError('No fields to update', []);
      }

      const updated = await UserModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      )
        .lean()
        .exec();

      if (!updated) {
        throw new NotFoundError('User not found');
      }

      res.json(
        successResponse({
          user: this.mapUser(updated),
        })
      );
    } catch (error) {
      next(error);
    }
  }

  private mapUser(user: any): any {
    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider || 'google',
      role: user.role || 'user',
      status: user.status || 'active',
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private parseNumber(
    value: any,
    fallback: number,
    min: number,
    max: number
  ): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }
}
