import { Request, Response } from 'express';
import { tagService } from '../services/tag.service';

export const tagController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { name, category, color } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }

      const tag = await tagService.createTag({
        name,
        category,
        color,
        schoolId,
      });

      res.status(201).json({ success: true, data: tag, message: 'Tag created successfully' });
    } catch (error: any) {
      console.error('Error creating tag:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, error: 'Tag with this name already exists' });
      }
      res.status(500).json({ success: false, error: 'Failed to create tag' });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { search, category, isActive } = req.query;

      const tags = await tagService.getTags({
        schoolId,
        search: search as string,
        category: category as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      res.json({ success: true, data: tags });
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch tags' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const tag = await tagService.getTagById(id, schoolId);

      if (!tag) {
        return res.status(404).json({ success: false, error: 'Tag not found' });
      }

      res.json({ success: true, data: tag });
    } catch (error) {
      console.error('Error fetching tag:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch tag' });
    }
  },

  async search(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { q, limit } = req.query;

      if (!q) {
        return res.status(400).json({ success: false, error: 'Search query is required' });
      }

      const tags = await tagService.searchTags(
        q as string,
        schoolId,
        limit ? parseInt(limit as string) : 20
      );

      res.json({ success: true, data: tags });
    } catch (error) {
      console.error('Error searching tags:', error);
      res.status(500).json({ success: false, error: 'Failed to search tags' });
    }
  },

  async getCategories(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const categories = await tagService.getCategories(schoolId);

      res.json({ success: true, data: categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { name, category, color, isActive } = req.body;

      // Check if tag exists
      const existing = await tagService.getTagById(id, schoolId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Tag not found' });
      }

      const tag = await tagService.updateTag(id, schoolId, {
        name,
        category,
        color,
        isActive,
      });

      res.json({ success: true, data: tag, message: 'Tag updated successfully' });
    } catch (error: any) {
      console.error('Error updating tag:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, error: 'Tag with this name already exists' });
      }
      res.status(500).json({ success: false, error: 'Failed to update tag' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      // Check if tag exists
      const existing = await tagService.getTagById(id, schoolId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Tag not found' });
      }

      await tagService.deleteTag(id, schoolId);

      res.json({ success: true, message: 'Tag deleted successfully' });
    } catch (error) {
      console.error('Error deleting tag:', error);
      res.status(500).json({ success: false, error: 'Failed to delete tag' });
    }
  },
};
