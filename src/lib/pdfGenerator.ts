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
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  upi_id?: string;
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
  billingAddress?: {
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
  primary: [175, 31, 23] as [number, number, number], // Jager Red (hsl(3, 76%, 39%))
  secondary: [0, 0, 0] as [number, number, number], // Black
  text: [30, 30, 30] as [number, number, number],
  lightText: [100, 100, 100] as [number, number, number],
  tableHeader: [245, 245, 245] as [number, number, number],
  border: [230, 230, 230] as [number, number, number],
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generatePackingSlip = async (
  orderData: OrderPDFData,
  companyInfo: CompanyInfo = DEFAULT_COMPANY
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10; // Reduced from 15
  const contentWidth = pageWidth - (margin * 2);

  // Load Logo
  let logo: HTMLImageElement | null = null;
  try {
    logo = await loadImage('/jager_logo.png');
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  // Outer Border (Rounded rect styling)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3); // Thinner border
  doc.roundedRect(margin, margin, contentWidth, pageHeight - (margin * 2), 2, 2, 'S');

  // Header Section
  let yPos = margin + 8; // Reduced from 15

  // Header Layout: Address on LEFT, Logo on RIGHT

  // 1. Company Address (Left Aligned)
  doc.setFontSize(16); // Reduced from 20
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text((companyInfo.name || "Jager Clothing").toUpperCase(), margin + 5, yPos); // Reduced inner margin

  doc.setFontSize(8); // Reduced from 10
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.lightText);
  doc.text(companyInfo.address, margin + 5, yPos + 5); // Tighter spacing
  doc.text(`${companyInfo.city}, ${companyInfo.state} ${companyInfo.zip}`, margin + 5, yPos + 9);
  if (companyInfo.phone) {
    doc.text(companyInfo.phone, margin + 5, yPos + 13);
  }

  // 2. Logo (Right Aligned)
  if (logo) {
    const logoWidth = 28; // Reduced from 35
    const logoHeight = (logo.height / logo.width) * logoWidth;
    doc.addImage(logo, 'PNG', pageWidth - margin - logoWidth - 5, yPos - 3, logoWidth, logoHeight);
  }

  yPos += 22; // Reduced from 35

  // Shipping Address Only (Below Header)
  // Removed Billing Address as requested

  doc.setFontSize(10); // Reduced from 12
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text("Shipping Address:", margin + 5, yPos);

  doc.setFontSize(9); // Reduced from 11
  doc.setFont("helvetica", "normal");
  let addrY = yPos + 5; // Reduced from 7

  doc.text(orderData.customerName, margin + 5, addrY); addrY += 4.5; // Tighter line spacing
  doc.text(orderData.customerAddress.street, margin + 5, addrY); addrY += 4.5;
  doc.text(`${orderData.customerAddress.city}, ${orderData.customerAddress.state} ${orderData.customerAddress.zip}`, margin + 5, addrY); addrY += 4.5;
  doc.text(orderData.customerAddress.phone, margin + 5, addrY);

  yPos = addrY + 8; // Reduced from 12

  // "Your Order of..." Banner
  doc.setFontSize(11); // Reduced from 14
  doc.setFont("helvetica", "bold");
  const displayOrderId = orderData.orderId ? orderData.orderId.slice(0, 8).toUpperCase() : "UNKNOWN";
  doc.text(`Your Order of ${new Date(orderData.orderDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })} (#${displayOrderId})`, margin + 5, yPos);

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin + 3, yPos + 2, pageWidth - margin - 3, yPos + 2); // Tighter line spacing

  yPos += 10; // Reduced from 15

  // Items Table - NO PRICE, NO RATE as requested
  // Columns: Qty | Item Description
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin + 5, right: margin + 5 },
    head: [['QTY', 'PRODUCT', 'COLOR', 'SIZE']],
    body: orderData.items.map(item => {
      // Clean up redundant variant info from name if present
      // Expected format in DB: "ProductName - Size - Color"
      // We want to extract just "ProductName" since we have separate columns for size/color
      let cleanName = item.name;

      // Try to extract base product name by splitting on ' - '
      const parts = cleanName.split(' - ');
      if (parts.length >= 3) {
        // If we have at least 3 parts, assume format is "Name - Size - Color"
        // Take everything except the last 2 parts (size and color)
        cleanName = parts.slice(0, -2).join(' - ');
      } else if (parts.length === 2) {
        // If only 2 parts, might be "Name - Size" or just a name with dash
        // Check if the last part matches the size
        if (parts[1] === item.size) {
          cleanName = parts[0];
        }
      }

      return [
        item.quantity,
        cleanName,
        item.color,
        item.size
      ];
    }),
    theme: 'plain',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: COLORS.text,
      fontStyle: 'bold',
      fontSize: 9, // Reduced from 11
      halign: 'left',
      cellPadding: 3, // Reduced from 6
    },
    styles: {
      fontSize: 9, // Reduced from 11
      textColor: COLORS.text,
      cellPadding: 4, // Reduced from 8
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' }, // Qty - slightly smaller
      1: { cellWidth: 'auto', halign: 'left' }, // Product
      2: { cellWidth: 30, halign: 'center' }, // Color - reduced from 35
      3: { cellWidth: 22, halign: 'center' }, // Size - reduced from 25
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        if (data.column.index !== 1) { // Center everything except Product (index 1)
          data.cell.styles.halign = 'center';
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6; // Reduced from 10

  // Footer
  // Notes
  doc.setFontSize(8); // Reduced from 10
  doc.setFont("helvetica", "bold");
  doc.text("NOTES", margin + 5, finalY + 6); // Reduced spacing
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for buying from Jager Clothing!", margin + 5, finalY + 10);

  // Big Thank You (right bottom)
  const footerY = pageHeight - margin - 12; // Reduced from 20
  doc.setFontSize(11); // Reduced from 14
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary); // Jager Red "Thank You"
  doc.text("THANK YOU", pageWidth - margin - 5, footerY + 8, { align: "right" }); // Adjusted positioning

  doc.save(`packing-slip-${orderData.orderId.slice(0, 8)}.pdf`);
};

export const generateInvoice = async (
  orderData: OrderPDFData,
  invoiceNumber: string,
  companyInfo: CompanyInfo = DEFAULT_COMPANY,
  gstRate: number = 18
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Load Logo
  let logo: HTMLImageElement | null = null;
  try {
    logo = await loadImage('/jager_logo.png');
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  // Helper for INR without symbol glitch
  const formatINR = (n: number) => `Rs. ${n.toLocaleString('en-IN')}`;

  let yPos = margin + 10;

  // --- HEADER ---
  // Left: Logo
  if (logo) {
    const logoWidth = 35;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    doc.addImage(logo, 'PNG', margin, yPos - 5, logoWidth, logoHeight);
  } else {
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(companyInfo?.name || "Jager Clothing", margin, yPos + 10);
  }

  // Right: INVOICE Title & Details
  const rightX = pageWidth - margin;
  doc.setFontSize(30); // Slightly smaller than 36 for elegance
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text("INVOICE", rightX, yPos + 5, { align: 'right' });

  // Invoice Details (Right, below "INVOICE")
  yPos += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.lightText);

  doc.text(`Invoice No. ${invoiceNumber}`, rightX, yPos, { align: 'right' });
  doc.text(`${new Date(orderData.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightX, yPos + 5, { align: 'right' });

  // --- ADDRESS SECTION ---
  yPos += 20;

  // "BILLED TO:" (Left)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text); // Black for label
  doc.text("BILLED TO:", margin, yPos);

  yPos += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Use Billing Address if available, else Customer Address
  const billAddr = orderData.billingAddress || orderData.customerAddress;
  const billName = orderData.billingAddress ? orderData.customerName : orderData.customerName;

  doc.text(billName, margin, yPos); yPos += 5;
  if (billAddr.phone) { doc.text(billAddr.phone, margin, yPos); yPos += 5; }
  doc.text(billAddr.street, margin, yPos); yPos += 5;
  doc.text(`${billAddr.city}, ${billAddr.state} ${billAddr.zip}`, margin, yPos); yPos += 5;
  doc.text("India", margin, yPos);

  // --- TABLE ---
  yPos += 15;

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    // Explicit Columns: Item, Size, Quantity, Price, Total
    head: [['Item', 'Size', 'Quantity', 'Price (Rs)', 'Total (Rs)']],
    body: orderData.items.map(item => [
      item.name + (item.color && !item.name.toLowerCase().includes(item.color.toLowerCase()) ? `\n(${item.color})` : ''), // Put Color with Name if not present
      item.size,
      item.quantity,
      formatINR(item.price),
      formatINR(item.price * item.quantity)
    ]),
    theme: 'plain',
    headStyles: {
      fillColor: [250, 250, 250],
      textColor: COLORS.text,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 4,
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      textColor: COLORS.text,
      cellPadding: 4,
      valign: 'middle',
      lineColor: COLORS.border,
      lineWidth: { bottom: 0.1 },
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' }, // Item - takes remaining space
      1: { cellWidth: 25, halign: 'center' }, // Size - increased to prevent wrapping
      2: { cellWidth: 30, halign: 'center' }, // Quantity - increased to prevent wrapping
      3: { cellWidth: 30, halign: 'right' }, // Price
      4: { cellWidth: 30, halign: 'right' }, // Total
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        // Center align Size and Quantity headers
        if (data.column.index === 1 || data.column.index === 2) data.cell.styles.halign = 'center';
        // Right align Price and Total headers
        if (data.column.index > 2) data.cell.styles.halign = 'right';
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // --- FOOTER & TOTALS ---
  const totalsX = pageWidth - margin;
  let currentY = finalY;

  const addTotalRow = (label: string, value: string, isBold: boolean = false) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(isBold ? 11 : 10);
    doc.setTextColor(...COLORS.text);

    doc.text(label, totalsX - 60, currentY, { align: 'right' });
    doc.text(value, totalsX, currentY, { align: 'right' });
    currentY += 8;
  };

  // No Tax, just Subtotal + Shipping (if any) -> Total
  // Using simplified total since user said "avoid tax".
  // Assuming orderData.total is already the final amount (users paying).
  // If we want to show breakdown:
  addTotalRow("Subtotal", formatINR(orderData.subtotal));
  if (orderData.shipping > 0) {
    addTotalRow("Shipping", formatINR(orderData.shipping));
  }

  // Divider
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 90, currentY - 4, totalsX, currentY - 4);

  addTotalRow("Total", formatINR(orderData.total), true);

  // // "Thank you!"
  // doc.setFontSize(14);
  // doc.setFont("helvetica", "normal");
  // doc.text("Thank you!", margin, finalY + 15);

  // Payment Info
  const paymentY = pageHeight - margin - 35;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT INFORMATION", margin, paymentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.lightText);
  doc.text(companyInfo?.name || "Jager Clothing", margin, paymentY + 5);
  // Account Details from settings
  if (companyInfo?.bank_name) {
    doc.text(`Bank: ${companyInfo.bank_name}`, margin, paymentY + 10);
  }
  if (companyInfo?.account_number) {
    doc.text(`A/c No: ${companyInfo.account_number}`, margin, paymentY + 15);
  }
  if (companyInfo?.ifsc_code) {
    doc.text(`IFSC: ${companyInfo.ifsc_code}`, margin, paymentY + 20);
  }
  if (companyInfo?.upi_id) {
    doc.text(`UPI ID: ${companyInfo.upi_id}`, margin, paymentY + 25);
  }

  // Company Footer
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text(companyInfo?.name || "Jager Clothing", pageWidth - margin, pageHeight - margin - 10, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.lightText);
  doc.text(companyInfo?.address || "", pageWidth - margin, pageHeight - margin - 5, { align: 'right' });
  doc.text(`${companyInfo?.city || ""}, ${companyInfo?.state || ""} - ${companyInfo?.zip || ""}`, pageWidth - margin, pageHeight - margin, { align: 'right' });

  doc.save(`invoice-${invoiceNumber}.pdf`);
};
const addHeader = (doc: jsPDF, company: CompanyInfo, title: string) => {
  // This function is no longer used by generatePackingSlip, and generateInvoice has its own simplified header.
  // Keeping it as a placeholder to avoid potential errors if other parts of the system still reference it.
  // In a real refactor, this would be removed or properly integrated.
  return 20;
};
