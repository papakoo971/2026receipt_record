import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { userModel, businessModel, receiptModel } from '../models/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

interface Business {
  id: number;
  user_id: number;
  name: string;
}

interface Receipt {
  id: number;
  image_path: string;
}

// Delete user account and all associated data
router.delete('/me', isAuthenticated, (req, res) => {
  try {
    const userId = req.user!.id;

    // Get all businesses for this user
    const businesses = businessModel.findByUserId(userId) as Business[];

    // Delete all receipt images
    for (const business of businesses) {
      const receipts = receiptModel.findByBusinessId(business.id) as Receipt[];
      for (const receipt of receipts) {
        const imagePath = path.join(__dirname, '../../uploads', receipt.image_path);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    // Delete user (cascades to businesses, budget_items, and receipts)
    userModel.delete(userId);

    // Logout and destroy session
    req.logout((err) => {
      if (err) {
        console.error('Logout error during account deletion:', err);
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error during account deletion:', err);
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Account deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
