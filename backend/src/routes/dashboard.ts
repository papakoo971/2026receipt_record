import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { businessModel, budgetItemModel, receiptModel } from '../models/database.js';

const router = Router();

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

interface Receipt {
  id: number;
  budget_item_id: number;
  date: string;
  description: string;
  amount: number;
  notes: string | null;
  image_path: string;
  created_at: string;
  item_name?: string;
}

// Get dashboard data for a business
router.get('/:businessId', isAuthenticated, (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    const business = businessModel.findById(businessId) as Business | undefined;

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get budget items
    const budgetItems = budgetItemModel.findByBusinessId(businessId) as BudgetItem[];

    // Calculate spending for each budget item
    const itemsWithSpending = budgetItems.map(item => {
      const spent = receiptModel.getTotalByBudgetItemId(item.id);
      const remaining = item.budget_amount - spent;
      const executionRate = item.budget_amount > 0 
        ? Math.round((spent / item.budget_amount) * 100) 
        : 0;

      return {
        id: item.id,
        name: item.name,
        budget: item.budget_amount,
        spent,
        remaining,
        executionRate,
      };
    });

    // Calculate totals
    const totalBudget = itemsWithSpending.reduce((sum, item) => sum + item.budget, 0);
    const totalSpent = itemsWithSpending.reduce((sum, item) => sum + item.spent, 0);
    const remaining = totalBudget - totalSpent;
    const executionRate = totalBudget > 0 
      ? Math.round((totalSpent / totalBudget) * 100) 
      : 0;

    // Get all receipts for this business
    const receipts = receiptModel.findByBusinessId(businessId) as Receipt[];

    res.json({
      business: {
        id: business.id,
        name: business.name,
      },
      summary: {
        totalBudget,
        totalSpent,
        remaining,
        executionRate,
      },
      items: itemsWithSpending,
      receipts: receipts.map(receipt => ({
        id: receipt.id,
        date: receipt.date,
        itemName: receipt.item_name,
        description: receipt.description,
        amount: receipt.amount,
        notes: receipt.notes,
        imagePath: receipt.image_path,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
