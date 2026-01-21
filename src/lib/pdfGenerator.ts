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
  const margin = 15;
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
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, margin, contentWidth, pageHeight - (margin * 2), 3, 3, 'S');

  // Header Section
  let yPos = margin + 15;

  // Header Layout: Address on LEFT, Logo on RIGHT

  // 1. Company Address (Left Aligned)
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text((companyInfo.name || "Jager Clothing").toUpperCase(), margin + 10, yPos);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.lightText);
  doc.text(companyInfo.address, margin + 10, yPos + 6);
  doc.text(`${companyInfo.city}, ${companyInfo.state} ${companyInfo.zip}`, margin + 10, yPos + 11);

  // 2. Logo (Right Aligned)
  if (logo) {
    const logoWidth = 35;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    doc.addImage(logo, 'PNG', pageWidth - margin - logoWidth - 10, yPos - 5, logoWidth, logoHeight);
  }

  yPos += 35;

  // Shipping Address Only (Below Header)
  // Removed Billing Address as requested

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.text);
  doc.text("Shipping Address:", margin + 10, yPos);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  let addrY = yPos + 7;

  doc.text(orderData.customerName, margin + 10, addrY); addrY += 6;
  doc.text(orderData.customerAddress.street, margin + 10, addrY); addrY += 6;
  doc.text(`${orderData.customerAddress.city}, ${orderData.customerAddress.state} ${orderData.customerAddress.zip}`, margin + 10, addrY); addrY += 6;
  doc.text(orderData.customerAddress.phone, margin + 10, addrY);

  yPos = addrY + 25;

  // "Your Order of..." Banner
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const displayOrderId = orderData.orderId ? orderData.orderId.slice(0, 8).toUpperCase() : "UNKNOWN";
  doc.text(`Your Order of ${new Date(orderData.orderDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })} (#${displayOrderId})`, margin + 10, yPos);

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin + 5, yPos + 3, pageWidth - margin - 5, yPos + 3);

  yPos += 15;

  // Items Table - NO PRICE, NO RATE as requested
  // Columns: Qty | Item Description
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin + 5, right: margin + 5 },
    head: [['QTY', 'ITEM DESCRIPTION']],
    body: orderData.items.map(item => [
      item.quantity,
      `${item.name}\nColor: ${item.color} | Size: ${item.size}`
    ]),
    theme: 'plain',
    headStyles: {
      fillColor: [240, 240, 240], // Slightly darker gray for better visibility
      textColor: COLORS.text,
      fontStyle: 'bold',
      fontSize: 11, // Bigger
      halign: 'left',
      cellPadding: 6,
    },
    styles: {
      fontSize: 11, // Bigger body
      textColor: COLORS.text,
      cellPadding: 8, // More padding
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' }, // Qty
      1: { cellWidth: 'auto' }, // Description
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Footer
  // Notes
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("NOTES", margin + 10, finalY + 10);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for buying from Jager Clothing!", margin + 10, finalY + 16);

  // Big Thank You (right bottom)
  const footerY = pageHeight - margin - 20;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary); // Jager Red "Thank You"
  doc.text("THANK YOU", pageWidth - margin - 10, footerY + 12, { align: "right" });

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
