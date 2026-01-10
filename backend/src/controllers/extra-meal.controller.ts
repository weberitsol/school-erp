import { Request, Response } from 'express';
import { extraMealService } from '../services/extra-meal.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Extra Meal Controller
 * PHASE 5: Handles HTTP requests for extra meal bookings
 */

export const extraMealController = {
  /**
   * Book extra meal(s)
   * POST /api/v1/mess/extra-meals
   */
  async bookExtraMeal(req: Request, res: Response) {
    try {
      const { enrollmentId, mealDate, quantity, unitCost, schoolId } = req.body;

      if (!enrollmentId || !mealDate || !quantity || !unitCost || !schoolId) {
        return res.status(400).json({
          error: 'enrollmentId, mealDate, quantity, unitCost, and schoolId are required',
        });
      }

      const booking = await extraMealService.bookExtraMeal({
        enrollmentId,
        mealDate: new Date(mealDate),
        quantity: parseInt(quantity),
        unitCost: new Decimal(unitCost),
        schoolId,
      });

      res.status(201).json({
        message: 'Extra meal booked successfully',
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Get extra meals with filtering
   * GET /api/v1/mess/extra-meals
   */
  async getExtraMeals(req: Request, res: Response) {
    try {
      const { enrollmentId, schoolId, status, skip, take } = req.query;

      const filters = {
        enrollmentId: enrollmentId as string | undefined,
        schoolId: schoolId as string | undefined,
        status: status as string | undefined,
      };

      const pagination = {
        skip: skip ? parseInt(skip as string) : 0,
        take: take ? parseInt(take as string) : 50,
      };

      const result = await extraMealService.getExtraMeals(filters, pagination);

      res.status(200).json({
        data: result.data,
        total: result.total,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Get single extra meal booking
   * GET /api/v1/mess/extra-meals/:id
   */
  async getExtraMealById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const booking = await extraMealService.getExtraMealById(id);

      if (!booking) {
        return res.status(404).json({
          error: 'Booking not found',
        });
      }

      res.status(200).json({
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Update extra meal booking
   * PUT /api/v1/mess/extra-meals/:id
   */
  async updateExtraMeal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { quantity, unitCost, status } = req.body;

      const updateData = {
        quantity: quantity ? parseInt(quantity) : undefined,
        unitCost: unitCost ? new Decimal(unitCost) : undefined,
        status,
      };

      const booking = await extraMealService.updateExtraMeal(id, updateData);

      res.status(200).json({
        message: 'Booking updated',
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Cancel extra meal booking
   * DELETE /api/v1/mess/extra-meals/:id
   */
  async cancelExtraMeal(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const booking = await extraMealService.cancelExtraMeal(id);

      res.status(200).json({
        message: 'Booking cancelled',
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Get monthly extra meal cost summary
   * GET /api/v1/mess/enrollments/:enrollmentId/extra-meals/cost
   */
  async getMonthlyExtraMealCost(req: Request, res: Response) {
    try {
      const { enrollmentId } = req.params;
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({
          error: 'month and year are required',
        });
      }

      const summary = await extraMealService.getMonthlyExtraMealCost(
        enrollmentId,
        parseInt(month as string),
        parseInt(year as string)
      );

      res.status(200).json({
        data: summary,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Approve extra meal booking
   * PUT /api/v1/mess/extra-meals/:id/approve
   */
  async approveExtraMeal(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const booking = await extraMealService.approveExtraMeal(id);

      res.status(200).json({
        message: 'Booking approved',
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Mark extra meal as served
   * PUT /api/v1/mess/extra-meals/:id/mark-served
   */
  async markAsServed(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const booking = await extraMealService.markAsServed(id);

      res.status(200).json({
        message: 'Meal marked as served',
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },
};
