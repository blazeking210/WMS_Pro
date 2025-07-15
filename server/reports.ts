import { storage } from "./storage";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { UserSettings } from "@shared/schema";

// Extend jsPDF interface to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

// Currency formatting function
function formatCurrency(amount: number, userSettings?: UserSettings): string {
  const symbol = userSettings?.currencySymbol || "$";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  zoneId?: number;
  category?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  productId?: string;
}

export interface ReportData {
  inventory: any[];
  movements: any[];
  zones: any[];
  lowStockItems: any[];
  outOfStockItems: any[];
  metrics: any;
}

export async function generateReportData(filters: ReportFilters = {}): Promise<ReportData> {
  const { startDate, endDate, zoneId, category, status, productId } = filters;
  
  // Get inventory data
  const inventory = await storage.getProducts({
    zoneId,
    category,
    status,
    search: productId,
  });

  // Get movements data with date filtering
  const movements = await storage.getMovements(undefined, 1000);
  const filteredMovements = movements.filter(movement => {
    if (startDate && new Date(movement.createdAt) < new Date(startDate)) return false;
    if (endDate && new Date(movement.createdAt) > new Date(endDate)) return false;
    return true;
  });

  // Get zones data
  const zones = await storage.getZones();

  // Get low stock and out of stock items
  const lowStockItems = await storage.getProducts({ status: 'low_stock' });
  const outOfStockItems = await storage.getProducts({ status: 'out_of_stock' });

  // Get dashboard metrics
  const metrics = await storage.getDashboardMetrics();

  return {
    inventory,
    movements: filteredMovements,
    zones,
    lowStockItems,
    outOfStockItems,
    metrics,
  };
}

export async function generateExcelReport(data: ReportData, reportType: string, userSettings?: UserSettings): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();

  // Inventory Sheet
  if (data.inventory.length > 0) {
    const inventoryData = data.inventory.map(item => ({
      'Product ID': item.productId,
      'Product Name': item.name,
      'Description': item.description,
      'Category': item.category,
      'Current Stock': item.currentStock,
      'Min Stock': item.minStock,
      'Unit Price': formatCurrency(item.unitPrice || 0, userSettings),
      'Total Value': formatCurrency((item.currentStock || 0) * (item.unitPrice || 0), userSettings),
      'Zone': item.zone?.name || 'No Zone',
      'Status': item.currentStock > item.minStock ? 'In Stock' : 
                item.currentStock > 0 ? 'Low Stock' : 'Out of Stock',
      'Created Date': new Date(item.createdAt).toLocaleDateString(),
      'Last Updated': new Date(item.updatedAt).toLocaleDateString(),
    }));

    const inventorySheet = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Inventory');
  }

  // Movements Sheet
  if (data.movements.length > 0) {
    const movementsData = data.movements.map(movement => ({
      'Date': new Date(movement.createdAt).toLocaleDateString(),
      'Time': new Date(movement.createdAt).toLocaleTimeString(),
      'Product ID': movement.product.productId,
      'Product Name': movement.product.name,
      'Type': movement.type,
      'Quantity': movement.quantity,
      'Previous Stock': movement.previousStock,
      'New Stock': movement.newStock,
      'Reason': movement.reason || 'N/A',
      'User': movement.user ? `${movement.user.firstName} ${movement.user.lastName}` : 'System',
    }));

    const movementsSheet = XLSX.utils.json_to_sheet(movementsData);
    XLSX.utils.book_append_sheet(workbook, movementsSheet, 'Stock Movements');
  }

  // Zone Performance Sheet
  if (data.zones.length > 0) {
    const zoneData = data.zones.map(zone => ({
      'Zone Name': zone.name,
      'Description': zone.description,
      'Item Count': zone.itemCount || 0,
      'Capacity': zone.capacity || 'N/A',
      'Utilization': zone.capacity ? `${((zone.itemCount || 0) / zone.capacity * 100).toFixed(1)}%` : 'N/A',
      'Created Date': new Date(zone.createdAt).toLocaleDateString(),
    }));

    const zoneSheet = XLSX.utils.json_to_sheet(zoneData);
    XLSX.utils.book_append_sheet(workbook, zoneSheet, 'Zone Performance');
  }

  // Low Stock Alert Sheet
  if (data.lowStockItems.length > 0) {
    const lowStockData = data.lowStockItems.map(item => ({
      'Product ID': item.productId,
      'Product Name': item.name,
      'Current Stock': item.currentStock,
      'Min Stock': item.minStock,
      'Shortage': item.minStock - item.currentStock,
      'Unit Price': formatCurrency(item.unitPrice || 0, userSettings),
      'Reorder Value': formatCurrency((item.minStock - item.currentStock) * (item.unitPrice || 0), userSettings),
      'Zone': item.zone?.name || 'No Zone',
    }));

    const lowStockSheet = XLSX.utils.json_to_sheet(lowStockData);
    XLSX.utils.book_append_sheet(workbook, lowStockSheet, 'Low Stock Alerts');
  }

  // Summary Sheet
  const summaryData = [
    { Metric: 'Total Items', Value: data.metrics.totalItems },
    { Metric: 'Total Inventory Value', Value: formatCurrency(data.metrics.totalValue, userSettings) },
    { Metric: 'Low Stock Items', Value: data.metrics.lowStockItems },
    { Metric: 'Out of Stock Items', Value: data.metrics.outOfStockItems },
    { Metric: 'Total Zones', Value: data.zones.length },
    { Metric: 'Total Movements', Value: data.movements.length },
    { Metric: 'Report Generated', Value: new Date().toLocaleString() },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Convert workbook to buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
}

export async function generatePDFReport(data: ReportData, reportType: string, userSettings?: UserSettings): Promise<Buffer> {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // Header
  doc.setFontSize(20);
  doc.text('Warehouse Management Report', 20, 20);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
  doc.text(`Report Type: ${reportType}`, 20, 40);

  let yPosition = 60;

  // Summary Section
  doc.setFontSize(16);
  doc.text('Summary', 20, yPosition);
  yPosition += 10;

  const summaryData = [
    ['Total Items', data.metrics.totalItems.toString()],
    ['Total Inventory Value', formatCurrency(data.metrics.totalValue, userSettings)],
    ['Low Stock Items', data.metrics.lowStockItems.toString()],
    ['Out of Stock Items', data.metrics.outOfStockItems.toString()],
    ['Total Zones', data.zones.length.toString()],
    ['Total Movements', data.movements.length.toString()],
  ];

  doc.autoTable({
    head: [['Metric', 'Value']],
    body: summaryData,
    startY: yPosition,
    theme: 'striped',
    headStyles: { fillColor: [63, 81, 181] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Inventory Section (top 20 items)
  if (data.inventory.length > 0) {
    doc.setFontSize(16);
    doc.text('Inventory Overview (Top 20 Items)', 20, yPosition);
    yPosition += 10;

    const inventoryData = data.inventory.slice(0, 20).map(item => [
      item.productId,
      item.name,
      item.currentStock.toString(),
      item.minStock.toString(),
      formatCurrency(item.unitPrice || 0, userSettings),
      item.currentStock > item.minStock ? 'In Stock' : 
      item.currentStock > 0 ? 'Low Stock' : 'Out of Stock',
    ]);

    doc.autoTable({
      head: [['Product ID', 'Name', 'Current Stock', 'Min Stock', 'Unit Price', 'Status']],
      body: inventoryData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 9 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Add new page if needed
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Recent Movements Section (last 20 movements)
  if (data.movements.length > 0) {
    doc.setFontSize(16);
    doc.text('Recent Stock Movements (Last 20)', 20, yPosition);
    yPosition += 10;

    const movementsData = data.movements.slice(0, 20).map(movement => [
      new Date(movement.createdAt).toLocaleDateString(),
      movement.product.name,
      movement.type,
      movement.quantity.toString(),
      movement.newStock.toString(),
      movement.reason || 'N/A',
    ]);

    doc.autoTable({
      head: [['Date', 'Product', 'Type', 'Quantity', 'New Stock', 'Reason']],
      body: movementsData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 9 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Low Stock Alerts Section
  if (data.lowStockItems.length > 0) {
    // Add new page if needed
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.text('Low Stock Alerts', 20, yPosition);
    yPosition += 10;

    const lowStockData = data.lowStockItems.map(item => [
      item.productId,
      item.name,
      item.currentStock.toString(),
      item.minStock.toString(),
      (item.minStock - item.currentStock).toString(),
      formatCurrency((item.minStock - item.currentStock) * (item.unitPrice || 0), userSettings),
    ]);

    doc.autoTable({
      head: [['Product ID', 'Name', 'Current Stock', 'Min Stock', 'Shortage', 'Reorder Value']],
      body: lowStockData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69] },
      styles: { fontSize: 9 },
    });
  }

  return Buffer.from(doc.output('arraybuffer'));
}