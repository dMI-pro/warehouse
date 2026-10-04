export type TemplateFormat = 'excel' | 'csv';

export type ExportTemplate = {
  id: number;
  name: string;
  tableKey: 'products' | 'sales' | 'stock' | 'returns' | 'committees' | 'categories' | 'audit';
  format: TemplateFormat;
  columns?: string[];
  isDefault?: boolean;
};

const STORAGE_KEY = 'warehouse_export_templates';

export function loadTemplates(): ExportTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function saveTemplates(templates: ExportTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function getDefaultTemplate(tableKey: ExportTemplate['tableKey']): ExportTemplate | undefined {
  const templates = loadTemplates();
  return templates.find((t) => t.tableKey === tableKey && t.isDefault);
}

export function upsertTemplate(template: ExportTemplate) {
  const templates = loadTemplates();
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  saveTemplates(templates);
}

export function deleteTemplate(id: number) {
  const templates = loadTemplates().filter((t) => t.id !== id);
  saveTemplates(templates);
}
