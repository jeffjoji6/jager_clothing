import jsPDF from 'jspdf';

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
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
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: "JÄGER CLOTHING",
  address: "Your Company Address",
  city: "City",
  state: "State",
  zip: "ZIP Code",
  phone: "+91 XXXXX XXXXX",
  email: "info@jagerclothing.com",
  gstin: "GSTIN123456789",
};

export const generatePackingSlip = (
  orderData: OrderPDFData,
  companyInfo: CompanyInfo = DEFAULT_COMPANY
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Company Logo and Header
  doc.setFontSize(24);
  doc.setTextColor(220, 38, 38); // Jager red color
  doc.text(companyInfo.name, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("RETURN ADDRESS:", margin, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.text(companyInfo.address, margin, yPos);
  yPos += 5;
  doc.text(`${companyInfo.city}, ${companyInfo.state} ${companyInfo.zip}`, margin, yPos);
  yPos += 5;
  doc.text(`Phone: ${companyInfo.phone}`, margin, yPos);
  yPos += 5;
  if (companyInfo.email) {
    doc.text(`Email: ${companyInfo.email}`, margin, yPos);
    yPos += 5;
  }
  if (companyInfo.gstin) {
    doc.text(`GSTIN: ${companyInfo.gstin}`, margin, yPos);
    yPos += 5;
  }

  // Line separator
  yPos += 5;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Order ID
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`ORDER #${orderData.orderId.slice(0, 8).toUpperCase()}`, margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${orderData.orderDate}`, margin, yPos);
  yPos += 10;

  // TO: Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SHIP TO:", margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(orderData.customerName, margin, yPos);
  yPos += 5;
  doc.text(orderData.customerAddress.street, margin, yPos);
  yPos += 5;
  doc.text(
    `${orderData.customerAddress.city}, ${orderData.customerAddress.state} ${orderData.customerAddress.zip}`,
    margin,
    yPos
  );
  yPos += 5;
  doc.text(`Phone: ${orderData.customerAddress.phone}`, margin, yPos);
  yPos += 10;

  // Line separator
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Order Contents Header
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ORDER CONTENTS:", margin, yPos);
  yPos += 8;

  // Order Items
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  orderData.items.forEach((item) => {
    checkPageBreak(15);
    const itemText = `${item.quantity}x ${item.name} - ${item.size} - ${item.color}`;
    doc.text(itemText, margin, yPos);
    yPos += 6;
  });

  yPos += 5;
  checkPageBreak(20);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Order Summary (if space allows)
  doc.setFontSize(9);
  doc.text("Order Summary:", margin, yPos);
  yPos += 6;
  doc.text(`Subtotal: ₹${orderData.subtotal.toLocaleString()}`, margin, yPos);
  yPos += 5;
  doc.text(`Shipping: ₹${orderData.shipping.toLocaleString()}`, margin, yPos);
  yPos += 5;
  doc.text(`Tax: ₹${orderData.tax.toLocaleString()}`, margin, yPos);
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ₹${orderData.total.toLocaleString()}`, margin, yPos);

  // Save PDF
  doc.save(`order-${orderData.orderId.slice(0, 8)}-packing-slip.pdf`);
};

export const generateInvoice = (
  orderData: OrderPDFData,
  invoiceNumber: string,
  companyInfo?: CompanyInfo,
  gstRate: number = 18
) => {
  const company = companyInfo || DEFAULT_COMPANY;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  // Company Header
  doc.setFontSize(24);
  doc.setTextColor(220, 38, 38);
  doc.setFont("helvetica", "bold");
  doc.text(company.name, margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(company.address, margin, yPos);
  yPos += 5;
  doc.text(`${company.city}, ${company.state} ${company.zip}`, margin, yPos);
  yPos += 5;
  doc.text(`Phone: ${company.phone} | Email: ${company.email}`, margin, yPos);
  yPos += 5;
  if (company.gstin) {
    doc.text(`GSTIN: ${company.gstin}`, margin, yPos);
    yPos += 10;
  }

  // Invoice Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", pageWidth - margin, yPos, { align: "right" });
  yPos += 15;

  // Invoice Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: ${invoiceNumber}`, margin, yPos);
  doc.text(`Date: ${orderData.orderDate}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 6;
  doc.text(`Order ID: ${orderData.orderId.slice(0, 8).toUpperCase()}`, margin, yPos);
  yPos += 15;

  // Bill To Section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(orderData.customerName, margin, yPos);
  yPos += 5;
  doc.text(orderData.customerAddress.street, margin, yPos);
  yPos += 5;
  doc.text(
    `${orderData.customerAddress.city}, ${orderData.customerAddress.state} ${orderData.customerAddress.zip}`,
    margin,
    yPos
  );
  yPos += 5;
  doc.text(`Phone: ${orderData.customerAddress.phone}`, margin, yPos);
  yPos += 15;

  // Table Header
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const tableY = yPos;
  doc.text("Item", margin, yPos);
  doc.text("Size/Color", margin + 50, yPos);
  doc.text("Qty", margin + 90, yPos);
  doc.text("Rate", margin + 110, yPos, { align: "right" });
  doc.text("Amount", pageWidth - margin, yPos, { align: "right" });
  yPos += 5;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Table Rows
  doc.setFont("helvetica", "normal");
  let totalAmount = 0;
  orderData.items.forEach((item) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    const itemTotal = item.price * item.quantity;
    totalAmount += itemTotal;

    doc.text(item.name.substring(0, 25), margin, yPos);
    doc.text(`${item.size}/${item.color.substring(0, 10)}`, margin + 50, yPos);
    doc.text(item.quantity.toString(), margin + 90, yPos);
    doc.text(`₹${item.price.toLocaleString()}`, margin + 110, yPos, { align: "right" });
    doc.text(`₹${itemTotal.toLocaleString()}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
  });

  yPos += 5;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Calculate GST
  const subtotalBeforeTax = totalAmount + orderData.shipping;
  const cgst = (subtotalBeforeTax * gstRate) / (100 + gstRate) / 2;
  const sgst = cgst;
  const totalGST = cgst + sgst;
  const taxableAmount = subtotalBeforeTax - totalGST;

  // Summary
  doc.setFontSize(9);
  const summaryX = pageWidth - margin - 60;
  doc.text("Subtotal (Before Tax):", summaryX, yPos);
  doc.text(`₹${subtotalBeforeTax.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 6;

  doc.text(`CGST (${gstRate / 2}%):`, summaryX, yPos);
  doc.text(`₹${cgst.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 6;

  doc.text(`SGST (${gstRate / 2}%):`, summaryX, yPos);
  doc.text(`₹${sgst.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL:", summaryX, yPos);
  doc.text(`₹${orderData.total.toLocaleString()}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 10;

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(
    "This is a computer-generated invoice and is valid without signature.",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  // Save PDF
  doc.save(`invoice-${invoiceNumber}-${orderData.orderId.slice(0, 8)}.pdf`);
};

