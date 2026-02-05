import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { businessModel, budgetItemModel, receiptModel, getDb } from '../models/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

interface BudgetItemInput {
  name: string;
  budgetAmount: number;
}

interface Business {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

interface BudgetItem {
  id: number;
  business_id: number;
  name: string;
  budget_amount: number;
}

// Get all businesses for current user
router.get('/', isAuthenticated, (req, res) => {
  try {
    const businesses = businessModel.findByUserId(req.user!.id) as Business[];
    
    // Get budget items for each business
    const result = businesses.map(business => {
      const items = budgetItemModel.findByBusinessId(business.id) as BudgetItem[];
      return {
        id: business.id,
        name: business.name,
        createdAt: business.created_at,
        budgetItems: items.map(item => ({
          id: item.id,
          name: item.name,
          budgetAmount: item.budget_amount
        }))
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// Get single business by ID
router.get('/:id', isAuthenticated, (req, res) => {
  try {
    const business = businessModel.findById(parseInt(req.params.id)) as Business | undefined;
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check ownership
    if (business.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const items = budgetItemModel.findByBusinessId(business.id) as BudgetItem[];
    
    res.json({
      id: business.id,
      name: business.name,
      createdAt: business.created_at,
      budgetItems: items.map(item => ({
        id: item.id,
        name: item.name,
        budgetAmount: item.budget_amount
      }))
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

// Create new business with budget items
router.post('/', isAuthenticated, (req, res) => {
  try {
    const { name, budgetItems } = req.body as { name: string; budgetItems: BudgetItemInput[] };

    if (!name || !budgetItems || budgetItems.length === 0) {
      return res.status(400).json({ 
        error: 'Business name and at least one budget item are required' 
      });
    }

    // Create business
    const businessId = businessModel.create(req.user!.id, name);

    // Create budget items
    for (const item of budgetItems) {
      budgetItemModel.create(Number(businessId), item.name, item.budgetAmount);
    }

    const business = businessModel.findById(Number(businessId)) as Business;
    const items = budgetItemModel.findByBusinessId(Number(businessId)) as BudgetItem[];

    res.status(201).json({
      id: business.id,
      name: business.name,
      createdAt: business.created_at,
      budgetItems: items.map(item => ({
        id: item.id,
        name: item.name,
        budgetAmount: item.budget_amount
      }))
    });
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

// Update business
router.put('/:id', isAuthenticated, (req, res) => {
  try {
    const businessId = parseInt(req.params.id);
    const { name, budgetItems } = req.body as { name: string; budgetItems: BudgetItemInput[] };

    const business = businessModel.findById(businessId) as Business | undefined;
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update business name
    businessModel.update(businessId, name);

    // Delete existing budget items (cascades to receipts)
    budgetItemModel.deleteByBusinessId(businessId);

    // Create new budget items
    for (const item of budgetItems) {
      budgetItemModel.create(businessId, item.name, item.budgetAmount);
    }

    const updatedBusiness = businessModel.findById(businessId) as Business;
    const items = budgetItemModel.findByBusinessId(businessId) as BudgetItem[];

    res.json({
      id: updatedBusiness.id,
      name: updatedBusiness.name,
      createdAt: updatedBusiness.created_at,
      budgetItems: items.map(item => ({
        id: item.id,
        name: item.name,
        budgetAmount: item.budget_amount
      }))
    });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

// Delete business
router.delete('/:id', isAuthenticated, (req, res) => {
  try {
    const businessId = parseInt(req.params.id);
    const business = businessModel.findById(businessId) as Business | undefined;

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all receipts to delete their images
    interface Receipt {
      id: number;
      image_path: string;
    }
    const receipts = receiptModel.findByBusinessId(businessId) as Receipt[];
    
    // Delete image files
    for (const receipt of receipts) {
      const imagePath = path.join(__dirname, '../../uploads', receipt.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete business (cascades to budget_items and receipts)
    businessModel.delete(businessId);

    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ error: 'Failed to delete business' });
  }
});

export default router;
