import { Request, Response } from 'express';
import { patternService } from '../services/pattern.service';

class PatternController {
  // Create pattern
  async createPattern(req: Request, res: Response) {
    try {
      const data = {
        ...req.body,
        createdById: req.user?.id,
      };

      const pattern = await patternService.createPattern(data);
      res.status(201).json({
        success: true,
        message: 'Pattern created successfully',
        data: pattern,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create pattern',
      });
    }
  }

  // Get all patterns
  async getPatterns(req: Request, res: Response) {
    try {
      const { patternType, isDefault, subjectId, search, isActive } = req.query;

      const patterns = await patternService.getPatterns({
        patternType: patternType as any,
        isDefault: isDefault === 'true' ? true : isDefault === 'false' ? false : undefined,
        subjectId: subjectId as string,
        search: search as string,
        isActive: isActive === 'false' ? false : true,
      });

      res.json({
        success: true,
        data: patterns,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch patterns',
      });
    }
  }

  // Get default patterns
  async getDefaultPatterns(req: Request, res: Response) {
    try {
      const patterns = await patternService.getDefaultPatterns();
      res.json({
        success: true,
        data: patterns,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch default patterns',
      });
    }
  }

  // Get pattern by ID
  async getPatternById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pattern = await patternService.getPatternById(id);

      if (!pattern) {
        return res.status(404).json({
          success: false,
          message: 'Pattern not found',
        });
      }

      res.json({
        success: true,
        data: pattern,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch pattern',
      });
    }
  }

  // Update pattern
  async updatePattern(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pattern = await patternService.updatePattern(id, req.body);

      res.json({
        success: true,
        message: 'Pattern updated successfully',
        data: pattern,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update pattern',
      });
    }
  }

  // Delete pattern
  async deletePattern(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await patternService.deletePattern(id);

      res.json({
        success: true,
        message: 'Pattern deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete pattern',
      });
    }
  }

  // Clone pattern
  async clonePattern(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Name is required for cloned pattern',
        });
      }

      const pattern = await patternService.clonePattern(
        id,
        name,
        req.user?.id || ''
      );

      res.status(201).json({
        success: true,
        message: 'Pattern cloned successfully',
        data: pattern,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to clone pattern',
      });
    }
  }

  // Seed default patterns
  async seedDefaults(req: Request, res: Response) {
    try {
      const result = await patternService.seedDefaultPatterns();

      res.json({
        success: true,
        message: 'Default patterns seeded',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to seed default patterns',
      });
    }
  }
}

export const patternController = new PatternController();
