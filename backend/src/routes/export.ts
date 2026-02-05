import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { businessModel, budgetItemModel, receiptModel } from '../models/database.js';
import { getUploadsDir } from '../index.js';
import ExcelJS from 'exceljs';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';

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

// Export to Excel
router.get('/excel/:businessId', isAuthenticated, async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    const business = businessModel.findById(businessId) as Business | undefined;

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const budgetItems = budgetItemModel.findByBusinessId(businessId) as BudgetItem[];
    const receipts = receiptModel.findByBusinessId(businessId) as Receipt[];

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Receipt Record';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('예산 요약');
    summarySheet.columns = [
      { header: '집행 항목', key: 'name', width: 20 },
      { header: '예산', key: 'budget', width: 15 },
      { header: '지출', key: 'spent', width: 15 },
      { header: '잔액', key: 'remaining', width: 15 },
      { header: '집행률 (%)', key: 'rate', width: 12 },
    ];

    // Style header row
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    let totalBudget = 0;
    let totalSpent = 0;

    for (const item of budgetItems) {
      const spent = receiptModel.getTotalByBudgetItemId(item.id);
      const remaining = item.budget_amount - spent;
      const rate = item.budget_amount > 0 
        ? Math.round((spent / item.budget_amount) * 100) 
        : 0;

      totalBudget += item.budget_amount;
      totalSpent += spent;

      summarySheet.addRow({
        name: item.name,
        budget: item.budget_amount,
        spent,
        remaining,
        rate,
      });
    }

    // Add total row
    summarySheet.addRow({
      name: '합계',
      budget: totalBudget,
      spent: totalSpent,
      remaining: totalBudget - totalSpent,
      rate: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    });
    const lastRow = summarySheet.lastRow;
    if (lastRow) {
      lastRow.font = { bold: true };
    }

    // Format currency columns
    ['budget', 'spent', 'remaining'].forEach(col => {
      summarySheet.getColumn(col).numFmt = '#,##0';
    });

    // Receipts sheet
    const receiptsSheet = workbook.addWorksheet('영수증 내역');
    receiptsSheet.columns = [
      { header: '날짜', key: 'date', width: 12 },
      { header: '집행 항목', key: 'itemName', width: 15 },
      { header: '상점명/내용', key: 'description', width: 25 },
      { header: '금액', key: 'amount', width: 15 },
      { header: '비고', key: 'notes', width: 30 },
    ];

    receiptsSheet.getRow(1).font = { bold: true };
    receiptsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    for (const receipt of receipts) {
      receiptsSheet.addRow({
        date: receipt.date,
        itemName: receipt.item_name,
        description: receipt.description,
        amount: receipt.amount,
        notes: receipt.notes || '',
      });
    }

    receiptsSheet.getColumn('amount').numFmt = '#,##0';

    // Set response headers
    const filename = `${business.name}_지출내역.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="export.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
});

// Export images as ZIP
router.get('/images/:businessId', isAuthenticated, async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    const business = businessModel.findById(businessId) as Business | undefined;

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const receipts = receiptModel.findByBusinessId(businessId) as Receipt[];

    if (receipts.length === 0) {
      return res.status(404).json({ error: 'No receipts found' });
    }

    // Set response headers
    const zipFilename = `${business.name}_영수증이미지.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="receipts.zip"; filename*=UTF-8''${encodeURIComponent(zipFilename)}`
    );

    // Create archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Add files to archive
    for (const receipt of receipts) {
      const imagePath = path.join(getUploadsDir(), receipt.image_path);
      if (fs.existsSync(imagePath)) {
        const ext = path.extname(receipt.image_path);
        const filename = `${receipt.date}_${receipt.item_name}_${receipt.description}${ext}`
          .replace(/[/\\?%*:|"<>]/g, '_'); // Remove invalid filename characters
        archive.file(imagePath, { name: filename });
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Error exporting images:', error);
    res.status(500).json({ error: 'Failed to export images' });
  }
});

// Export to Google Sheets
router.post('/sheets/:businessId', isAuthenticated, async (req, res) => {
  try {
    const businessId = parseInt(req.params.businessId);
    const business = businessModel.findById(businessId) as Business | undefined;

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    if (business.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Load service account credentials
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
      return res.status(500).json({ 
        error: 'Google Sheets API not configured. Service account file not found.' 
      });
    }

    const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    const budgetItems = budgetItemModel.findByBusinessId(businessId) as BudgetItem[];
    const receipts = receiptModel.findByBusinessId(businessId) as Receipt[];

    // Create spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `${business.name} - 지출 내역`,
        },
        sheets: [
          { properties: { title: '예산 요약' } },
          { properties: { title: '영수증 내역' } },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;

    // Prepare summary data
    const summaryData: (string | number)[][] = [
      ['집행 항목', '예산', '지출', '잔액', '집행률 (%)'],
    ];

    let totalBudget = 0;
    let totalSpent = 0;

    for (const item of budgetItems) {
      const spent = receiptModel.getTotalByBudgetItemId(item.id);
      const remaining = item.budget_amount - spent;
      const rate = item.budget_amount > 0 
        ? Math.round((spent / item.budget_amount) * 100) 
        : 0;

      totalBudget += item.budget_amount;
      totalSpent += spent;

      summaryData.push([item.name, item.budget_amount, spent, remaining, rate]);
    }

    summaryData.push([
      '합계',
      totalBudget,
      totalSpent,
      totalBudget - totalSpent,
      totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    ]);

    // Prepare receipts data
    const receiptsData: (string | number)[][] = [
      ['날짜', '집행 항목', '상점명/내용', '금액', '비고'],
    ];

    for (const receipt of receipts) {
      receiptsData.push([
        receipt.date,
        receipt.item_name || '',
        receipt.description,
        receipt.amount,
        receipt.notes || '',
      ]);
    }

    // Update sheets with data
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: '예산 요약!A1',
            values: summaryData,
          },
          {
            range: '영수증 내역!A1',
            values: receiptsData,
          },
        ],
      },
    });

    // Share with user's email
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: req.user!.email,
      },
    });

    res.json({
      message: 'Successfully exported to Google Sheets',
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    });
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    res.status(500).json({ error: 'Failed to export to Google Sheets' });
  }
});

export default router;
