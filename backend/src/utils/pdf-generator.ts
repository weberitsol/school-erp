import { FeePayment, FeeInvoice } from '@prisma/client';
import puppeteer from 'puppeteer';

/**
 * PDF Generator utility for receipts and invoices
 * Uses Puppeteer to convert HTML templates to PDF
 */

class PDFGenerator {
  private browser: any = null;

  /**
   * Initialize browser for PDF generation (singleton pattern)
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF from HTML string
   */
  async generatePdfFromHtml(html: string, filename: string): Promise<Buffer> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle2' });
      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      });
      return pdf;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate a payment receipt as HTML (can be converted to PDF with a library like puppeteer)
   */
  generatePaymentReceiptHTML(payment: FeePayment & { student?: any; feeStructure?: any; paidBy?: any }): string {
    const receiptDate = new Date().toLocaleDateString();
    const paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${payment.receiptNo}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 5px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #4CAF50;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0;
          font-size: 12px;
          color: #666;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-weight: bold;
          color: #4CAF50;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .label {
          font-weight: bold;
        }
        .amount {
          text-align: right;
          font-weight: bold;
        }
        .total-row {
          border-top: 2px solid #4CAF50;
          border-bottom: 2px solid #4CAF50;
          padding: 10px 0;
          font-weight: bold;
          font-size: 16px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <h1>Payment Receipt</h1>
          <p>Receipt No: ${payment.receiptNo}</p>
          <p>Date: ${receiptDate}</p>
        </div>

        <div class="section">
          <div class="section-title">Student Information</div>
          <div class="row">
            <span class="label">Name:</span>
            <span>${payment.student?.firstName || ''} ${payment.student?.lastName || ''}</span>
          </div>
          <div class="row">
            <span class="label">Admission No:</span>
            <span>${payment.student?.admissionNo || ''}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payment Details</div>
          <div class="row">
            <span class="label">Fee Type:</span>
            <span>${payment.feeStructure?.name || ''}</span>
          </div>
          <div class="row">
            <span class="label">Payment Date:</span>
            <span>${paymentDate}</span>
          </div>
          <div class="row">
            <span class="label">Payment Method:</span>
            <span>${payment.paymentMethod || 'Not specified'}</span>
          </div>
          ${payment.transactionId ? `
          <div class="row">
            <span class="label">Transaction ID:</span>
            <span>${payment.transactionId}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Amount Breakdown</div>
          <div class="row">
            <span class="label">Fee Amount:</span>
            <span class="amount">₹${payment.amount.toFixed(2)}</span>
          </div>
          ${payment.lateFee && Number(payment.lateFee) > 0 ? `
          <div class="row">
            <span class="label">Late Fee:</span>
            <span class="amount">₹${payment.lateFee.toFixed(2)}</span>
          </div>
          ` : ''}
          ${payment.discount && Number(payment.discount) > 0 ? `
          <div class="row">
            <span class="label">Discount:</span>
            <span class="amount">-₹${payment.discount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="row total-row">
            <span>Total Amount Paid:</span>
            <span>₹${payment.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for the payment!</p>
          <p>This is a computer-generated receipt.</p>
          <p>For queries, contact the administrative office.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return html;
  }

  /**
   * Generate an invoice as HTML
   */
  generateInvoiceHTML(invoice: FeeInvoice & { lineItems?: any[]; student?: any; school?: any }): string {
    const invoiceDate = new Date().toLocaleDateString();
    const dueDate = new Date(invoice.dueDate).toLocaleDateString();

    const lineItemsHTML = (invoice.lineItems || [])
      .map(
        (item) => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">₹${parseFloat(item.unitPrice).toFixed(2)}</td>
        <td style="text-align: right;">₹${parseFloat(item.amount).toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${invoice.invoiceNo}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 30px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2196F3;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #2196F3;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .invoice-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .invoice-info div {
          width: 45%;
        }
        .invoice-info label {
          font-weight: bold;
          color: #2196F3;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        table thead {
          background-color: #2196F3;
          color: white;
        }
        table th {
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
        }
        table td {
          padding: 10px;
          border: 1px solid #ddd;
        }
        table tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .summary {
          float: right;
          width: 40%;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .summary-total {
          border-top: 2px solid #2196F3;
          padding-top: 10px;
          margin-top: 10px;
          font-weight: bold;
          font-size: 16px;
        }
        .footer {
          clear: both;
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1>Invoice</h1>
          <p>${invoice.school?.name || 'School Name'}</p>
        </div>

        <div class="invoice-info">
          <div>
            <p><label>Invoice No:</label> ${invoice.invoiceNo}</p>
            <p><label>Date:</label> ${invoiceDate}</p>
            <p><label>Due Date:</label> ${dueDate}</p>
          </div>
          <div>
            <p><label>Student Name:</label> ${invoice.student?.firstName || ''} ${invoice.student?.lastName || ''}</p>
            <p><label>Admission No:</label> ${invoice.student?.admissionNo || ''}</p>
            <p><label>Status:</label> <span style="color: #ff9800; font-weight: bold;">${invoice.status}</span></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHTML}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>₹${invoice.subtotal.toFixed(2)}</span>
          </div>
          ${Number(invoice.discount) > 0 ? `
          <div class="summary-row">
            <span>Discount:</span>
            <span>-₹${invoice.discount.toFixed(2)}</span>
          </div>
          ` : ''}
          ${Number(invoice.tax) > 0 ? `
          <div class="summary-row">
            <span>Tax:</span>
            <span>₹${invoice.tax.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="summary-row summary-total">
            <span>Total Amount:</span>
            <span>₹${invoice.totalAmount.toFixed(2)}</span>
          </div>
          ${Number(invoice.paidAmount) > 0 ? `
          <div class="summary-row">
            <span>Amount Paid:</span>
            <span>₹${invoice.paidAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Balance Due:</span>
            <span>₹${(Number(invoice.totalAmount) - Number(invoice.paidAmount)).toFixed(2)}</span>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Please pay the outstanding amount by the due date.</p>
          <p>For queries, contact the administrative office.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return html;
  }

  /**
   * Generate payment receipt PDF
   */
  async generatePaymentReceiptPDF(payment: FeePayment & { student?: any; feeStructure?: any; paidBy?: any }): Promise<Buffer> {
    const html = this.generatePaymentReceiptHTML(payment);
    return await this.generatePdfFromHtml(html, `receipt-${payment.receiptNo}.pdf`);
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(invoice: FeeInvoice & { lineItems?: any[]; student?: any; school?: any }): Promise<Buffer> {
    const html = this.generateInvoiceHTML(invoice);
    return await this.generatePdfFromHtml(html, `invoice-${invoice.invoiceNo}.pdf`);
  }

  /**
   * Close browser instance (should be called on app shutdown)
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfGenerator = new PDFGenerator();
