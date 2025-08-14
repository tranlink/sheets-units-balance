import * as XLSX from 'xlsx';
import { Project as DBProject, Partner as DBPartner, Unit as DBUnit, Purchase as DBPurchase } from '@/lib/database';

interface ExportData {
  projects: DBProject[];
  partners: DBPartner[];
  units: DBUnit[];
  purchases: DBPurchase[];
}

export const exportToExcel = (data: ExportData, filename: string = 'construction-cost-tracker') => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // 1. Projects Sheet
  const projectsData = data.projects.map(project => ({
    'Project ID': project.id,
    'Project Name': project.name,
    'Description': project.description || '',
    'Location': project.location || '',
    'Total Budget': project.total_budget,
    'Categories': project.categories.join(', '),
    'Created Date': new Date(project.created_at).toLocaleDateString(),
    'Last Updated': new Date(project.updated_at).toLocaleDateString(),
  }));

  const projectsWorksheet = XLSX.utils.json_to_sheet(projectsData);
  XLSX.utils.book_append_sheet(workbook, projectsWorksheet, 'Projects');

  // 2. Partners Sheet
  const partnersData = data.partners.map(partner => ({
    'Partner ID': partner.id,
    'Partner Name': partner.name,
    'Email': partner.email || '',
    'Phone': partner.phone || '',
    'Total Contribution': partner.total_contribution,
    'Status': partner.status,
    'Project ID': partner.project_id,
    'Created Date': new Date(partner.created_at).toLocaleDateString(),
    'Last Updated': new Date(partner.updated_at).toLocaleDateString(),
  }));

  const partnersWorksheet = XLSX.utils.json_to_sheet(partnersData);
  XLSX.utils.book_append_sheet(workbook, partnersWorksheet, 'Partners');

  // 3. Units Sheet
  const unitsData = data.units.map(unit => {
    const unitPurchases = data.purchases.filter(p => p.unit_id === unit.id);
    const actualCost = unitPurchases.reduce((sum, p) => sum + p.total_cost, 0);
    const costPercentage = unit.budget > 0 ? ((actualCost / unit.budget) * 100).toFixed(2) : '0';

    return {
      'Unit ID': unit.id,
      'Unit Name': unit.name,
      'Type': unit.type,
      'Budget': unit.budget,
      'Actual Cost': actualCost,
      'Cost Percentage': `${costPercentage}%`,
      'Remaining Budget': unit.budget - actualCost,
      'Status': unit.status,
      'Partner ID': unit.partner_id || '',
      'Project ID': unit.project_id,
      'Completion Date': unit.completion_date || '',
      'Created Date': new Date(unit.created_at).toLocaleDateString(),
      'Last Updated': new Date(unit.updated_at).toLocaleDateString(),
    };
  });

  const unitsWorksheet = XLSX.utils.json_to_sheet(unitsData);
  XLSX.utils.book_append_sheet(workbook, unitsWorksheet, 'Units');

  // 4. Purchases Sheet
  const purchasesData = data.purchases.map(purchase => {
    const unit = data.units.find(u => u.id === purchase.unit_id);
    const partner = data.partners.find(p => p.id === purchase.partner_id);

    return {
      'Purchase ID': purchase.id,
      'Date': purchase.date,
      'Category': purchase.category,
      'Description': purchase.description,
      'Quantity': purchase.quantity,
      'Unit Price': purchase.unit_price,
      'Total Cost': purchase.total_cost,
      'Unit Name': unit?.name || '',
      'Partner Name': partner?.name || '',
      'Receipt URL': purchase.receipt_url || '',
      'Project ID': purchase.project_id,
      'Created Date': new Date(purchase.created_at).toLocaleDateString(),
      'Last Updated': new Date(purchase.updated_at).toLocaleDateString(),
    };
  });

  const purchasesWorksheet = XLSX.utils.json_to_sheet(purchasesData);
  XLSX.utils.book_append_sheet(workbook, purchasesWorksheet, 'Purchases');

  // 5. Summary Sheet
  const totalBudget = data.projects.reduce((sum, p) => sum + p.total_budget, 0);
  const totalSpent = data.purchases.reduce((sum, p) => sum + p.total_cost, 0);
  const remainingBudget = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) : '0';

  // Category breakdown
  const categoryBreakdown = data.purchases.reduce((acc, purchase) => {
    if (!acc[purchase.category]) {
      acc[purchase.category] = 0;
    }
    acc[purchase.category] += purchase.total_cost;
    return acc;
  }, {} as Record<string, number>);

  const summaryData = [
    { 'Metric': 'Total Projects', 'Value': data.projects.length },
    { 'Metric': 'Total Units', 'Value': data.units.length },
    { 'Metric': 'Total Partners', 'Value': data.partners.length },
    { 'Metric': 'Total Purchases', 'Value': data.purchases.length },
    { 'Metric': '', 'Value': '' }, // Empty row
    { 'Metric': 'Total Budget', 'Value': totalBudget },
    { 'Metric': 'Total Spent', 'Value': totalSpent },
    { 'Metric': 'Remaining Budget', 'Value': remainingBudget },
    { 'Metric': 'Spent Percentage', 'Value': `${spentPercentage}%` },
    { 'Metric': '', 'Value': '' }, // Empty row
    { 'Metric': 'CATEGORY BREAKDOWN', 'Value': '' },
    ...Object.entries(categoryBreakdown).map(([category, amount]) => ({
      'Metric': category,
      'Value': amount
    }))
  ];

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  // Save the file
  XLSX.writeFile(workbook, finalFilename);

  return finalFilename;
};

export const exportProjectToExcel = (
  project: DBProject,
  partners: DBPartner[],
  units: DBUnit[],
  purchases: DBPurchase[],
  filename?: string
) => {
  const exportData: ExportData = {
    projects: [project],
    partners: partners.filter(p => p.project_id === project.id),
    units: units.filter(u => u.project_id === project.id),
    purchases: purchases.filter(p => p.project_id === project.id),
  };

  const projectFilename = filename || `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
  return exportToExcel(exportData, projectFilename);
};