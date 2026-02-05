import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated } from '../middleware/auth.js';
import { receiptModel, budgetItemModel, businessModel } from '../models/database.js';
import { extractTextFromImage } from '../services/vision.js';
import { getUploadsDir } from '../index.js';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getUploadsDir();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

interface BudgetItem {
  id: number;
  business_id: number;
  name: string;
  budget_amount: number;
}

interface Business {
  id: number;
  user_id: number;
  name: string;
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

// Extract text from receipt image (OCR)
router.post('/extract', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = req.file.path;
    const extractedData = await extractTextFromImage(imagePath);

    res.json({
      imagePath: req.file.filename,
      date: extractedData.date || '',
      description: extractedData.description || '',
      amount: extractedData.amount || 0,
      rawText: extractedData.rawText,
    });
  } catch (error) {
    console.error('OCR extraction error:', error);
    res.status(500).json({ error: 'Failed to extract text from image' });
  }
});

// Save receipt
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { budgetItemId, date, description, amount, notes, imagePath } = req.body;

    if (!budgetItemId || !date || !description || amount === undefined || !imagePath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify budget item exists and user has access
    const budgetItem = budgetItemModel.findById(budgetItemId) as BudgetItem | undefined;
    if (!budgetItem) {
      return res.status(404).json({ error: 'Budget item not found' });
    }

    const business = businessModel.findById(budgetItem.business_id) as Business | undefined;
    if (!business || business.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const receiptId = receiptModel.create(
      budgetItemId,
      date,
      description,
      parseFloat(amount),
      notes || null,
      imagePath
    );

    const receipt = receiptModel.findById(Number(receiptId)) as Receipt;

    res.status(201).json({
      id: receipt.id,
      budgetItemId: receipt.budget_item_id,
      date: receipt.date,
      description: receipt.description,
      amount: receipt.amount,
      notes: receipt.notes,
      imagePath: receipt.image_path,
      createdAt: receipt.created_at,
    });
  } catch (error) {
    console.error('Error saving receipt:', error);
    res.status(500).json({ error: 'Failed to save receipt' });
  }
});

// Get receipts by business ID
router.get('/', isAuthenticated, (req, res) => {
  try {
    const { businessId } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const business = businessModel.findById(parseInt(businessId as string)) as Business | undefined;
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const receipts = receiptModel.findByBusinessId(parseInt(businessId as string)) as Receipt[];

    res.json(receipts.map(receipt => ({
      id: receipt.id,
      budgetItemId: receipt.budget_item_id,
      itemName: receipt.item_name,
      date: receipt.date,
      description: receipt.description,
      amount: receipt.amount,
      notes: receipt.notes,
      imagePath: receipt.image_path,
      createdAt: receipt.created_at,
    })));
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// Delete receipt
router.delete('/:id', isAuthenticated, (req, res) => {
  try {
    const receiptId = parseInt(req.params.id);
    const receipt = receiptModel.findById(receiptId) as Receipt | undefined;

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const budgetItem = budgetItemModel.findById(receipt.budget_item_id) as BudgetItem | undefined;
    if (!budgetItem) {
      return res.status(404).json({ error: 'Budget item not found' });
    }

    const business = businessModel.findById(budgetItem.business_id) as Business | undefined;
    if (!business || business.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete image file
    const imagePath = path.join(getUploadsDir(), receipt.image_path);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    receiptModel.delete(receiptId);

    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

// Cancel upload (delete temporary image)
router.delete('/cancel-upload/:filename', isAuthenticated, (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(getUploadsDir(), filename);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.json({ message: 'Upload cancelled' });
  } catch (error) {
    console.error('Error cancelling upload:', error);
    res.status(500).json({ error: 'Failed to cancel upload' });
  }
});

export default router;
