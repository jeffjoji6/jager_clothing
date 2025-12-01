import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  gstin?: string;
}

export interface OrderPDFData {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  };
  items: Array<{
    name: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod?: string;
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: "JAGER CLOTHING",
  address: "123 Fashion Street, Sector 4",
  city: "New Delhi",
  state: "Delhi",
  zip: "110001",
  phone: "+91 98765 43210",
  email: "support@jagerclothing.com",
  website: "www.jagerclothing.com",
  gstin: "07AABCU9603R1ZN",
};

const COLORS = {
  primary: [220, 38, 38] as [number, number, number], // Jager Red
  secondary: [60, 60, 60] as [number, number, number], // Dark Grey
  text: [30, 30, 30] as [number, number, number], // Black
  lightText: [100, 100, 100] as [number, number, number], // Grey
  tableHeader: [245, 245, 245] as [number, number, number], // Light Grey
};

const addHeader = (doc: jsPDF, company: CompanyInfo, title: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Company Name
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(company.name, 20, 25);

  // Document Title
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.secondary);
  doc.text(title, pageWidth - 20, 25, { align: "right" });

  // Company Details
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.lightText);
  doc.setFont("helvetica", "normal");
  let yPos = 35;
  doc.text(company.address, 20, yPos);
  yPos += 5;
  doc.text(`${company.city}, ${company.state} ${company.zip}`, 20, yPos);
  yPos += 5;
  doc.text(`Phone: ${company.phone}`, 20, yPos);
  yPos += 5;
  doc.text(`Email: ${company.email}`, 20, yPos);
  if (company.gstin) {
    yPos += 5;
    doc.text(`GSTIN: ${company.gstin}`, 20, yPos);
  }

  // Separator
  doc.setDrawColor(230, 230, 230);
  doc.line(20, 65, pageWidth - 20, 65);

  return 75; // Return Y position for next section
};

const addFooter = (doc: jsPDF, company: CompanyInfo) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(250, 250, 250);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.lightText);
  doc.text(
    `Thank you for choosing ${company.name}! Visit us at ${company.website}`,
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" }
  );
  doc.text(
    "This is a computer-generated document and does not require a signature.",
    pageWidth / 2,
    pageHeight - 7,
    { align: "center" }
  );
};

export const generatePackingSlip = (
  orderData: OrderPDFData,
  companyInfo: CompanyInfo = DEFAULT_COMPANY
) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, companyInfo, "PACKING SLIP");

  // Order & Shipping Info Grid
  doc.setFontSize(10);

  // Left Column: Order Details
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text("ORDER DETAILS", 20, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.lightText);
  doc.text(`Order ID: #${orderData.orderId.slice(0, 8).toUpperCase()}`, 20, yPos + 7);
  doc.text(`Date: ${new Date(orderData.orderDate).toLocaleDateString()}`, 20, yPos + 12);

  // Right Column: Ship To
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text("SHIP TO", 120, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.lightText);
  doc.text(orderData.customerName, 120, yPos + 7);
  doc.text(orderData.customerAddress.street, 120, yPos + 12);
  doc.text(
    `${orderData.customerAddress.city}, ${orderData.customerAddress.state} ${orderData.customerAddress.zip}`,
    120,
    yPos + 17
  );
  doc.text(`Phone: ${orderData.customerAddress.phone}`, 120, yPos + 22);

  yPos += 40;

  // Items Table
  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Size', 'Color', 'Qty']],
    body: orderData.items.map(item => [
      item.name,
      item.size,
      item.color,
      item.quantity
    ]),
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.tableHeader,
      textColor: COLORS.text,
      fontStyle: 'bold',
      cellPadding: 4,
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
      textColor: COLORS.text,
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Item
      1: { cellWidth: 30 }, // Size
      2: { cellWidth: 40 }, // Color
      3: { cellWidth: 20, halign: 'center' }, // Qty
    },
  });

  addFooter(doc, companyInfo);
  doc.save(`packing-slip-${orderData.orderId.slice(0, 8)}.pdf`);
};

export const generateInvoice = (
  orderData: OrderPDFData,
  invoiceNumber: string,
  companyInfo: CompanyInfo = DEFAULT_COMPANY,
  gstRate: number = 18
) => {
  const doc = new jsPDF();
  let yPos = addHeader(doc, companyInfo, "TAX INVOICE");

  // Order & Billing Info Grid
  doc.setFontSize(10);

  // Left Column: Invoice Details
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text("INVOICE DETAILS", 20, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.lightText);
  doc.text(`Invoice No: ${invoiceNumber}`, 20, yPos + 7);
  doc.text(`Order ID: #${orderData.orderId.slice(0, 8).toUpperCase()}`, 20, yPos + 12);
  doc.text(`Date: ${new Date(orderData.orderDate).toLocaleDateString()}`, 20, yPos + 17);
  if (orderData.paymentMethod) {
    doc.text(`Payment: ${orderData.paymentMethod}`, 20, yPos + 22);
  }

  // Right Column: Bill To
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text("BILL TO", 120, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.lightText);
  doc.text(orderData.customerName, 120, yPos + 7);
  doc.text(orderData.customerAddress.street, 120, yPos + 12);
  doc.text(
    `${orderData.customerAddress.city}, ${orderData.customerAddress.state} ${orderData.customerAddress.zip}`,
    120,
    yPos + 17
  );
  doc.text(`Phone: ${orderData.customerAddress.phone}`, 120, yPos + 22);

  yPos += 40;

  // Items Table
  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Details', 'Qty', 'Rate', 'Amount']],
    body: orderData.items.map(item => [
      item.name,
      `${item.size} / ${item.color}`,
      item.quantity,
      `₹${item.price.toLocaleString()}`,
      `₹${(item.price * item.quantity).toLocaleString()}`
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      cellPadding: 4,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: COLORS.text,
      lineColor: [230, 230, 230],
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Item
      1: { cellWidth: 40 }, // Details
      2: { cellWidth: 20, halign: 'center' }, // Qty
      3: { cellWidth: 30, halign: 'right' }, // Rate
      4: { cellWidth: 30, halign: 'right' }, // Amount
    },
    foot: [[
      { content: 'Total', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `₹${orderData.subtotal.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold' } }
    ]],
  });

  // Tax Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Calculate Tax Breakdown
  const subtotalBeforeTax = orderData.total - orderData.tax; // Simplified for display
  const cgst = orderData.tax / 2;
  const sgst = orderData.tax / 2;

  // Summary Box
  const summaryX = 120;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.lightText);

  doc.text("Subtotal:", summaryX, finalY);
  doc.text(`₹${orderData.subtotal.toLocaleString()}`, 190, finalY, { align: "right" });

  doc.text("Shipping:", summaryX, finalY + 6);
  doc.text(`₹${orderData.shipping.toLocaleString()}`, 190, finalY + 6, { align: "right" });

  doc.text(`CGST (${gstRate / 2}%):`, summaryX, finalY + 12);
  doc.text(`₹${cgst.toFixed(2)}`, 190, finalY + 12, { align: "right" });

  doc.text(`SGST (${gstRate / 2}%):`, summaryX, finalY + 18);
  doc.text(`₹${sgst.toFixed(2)}`, 190, finalY + 18, { align: "right" });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(summaryX, finalY + 24, 190, finalY + 24);

  // Grand Total
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("GRAND TOTAL:", summaryX, finalY + 32);
  doc.text(`₹${orderData.total.toLocaleString()}`, 190, finalY + 32, { align: "right" });

  addFooter(doc, companyInfo);
  doc.save(`invoice-${invoiceNumber}-${orderData.orderId.slice(0, 8)}.pdf`);
};
