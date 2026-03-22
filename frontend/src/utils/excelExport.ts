import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

export type ExcelColumn = {
  key: string;
  header: string;
  type?: 'string' | 'number' | 'date' | 'url';
};

export type ExportOptions = {
  totals?: boolean;
  tableName?: string;
  imageFields?: string[];
  fileName?: string;
  dateFormat?: string;
  linkResolver?: (value: any, key: string) => { text: string; url: string } | string | null;
};

const defaultDateFormat = 'yyyy-MM-dd HH:mm';

function formatCellValue(value: any, type: ExcelColumn['type'], dateFormat?: string) {
  if (value === null || value === undefined) return '';
  switch (type) {
    case 'number':
      return typeof value === 'number' ? value : Number(value) || 0;
    case 'date':
      try {
        const d = value instanceof Date ? value : new Date(value);
        if (isNaN(d.getTime())) return String(value);
        // ExcelJS can accept Date directly; set number format on column
        return d;
      } catch {
        return String(value);
      }
    default:
      return String(value);
  }
}

export async function exportExcelTable(
  columns: ExcelColumn[],
  rows: Record<string, any>[],
  options?: ExportOptions
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Данные');

  const dateFormat = options?.dateFormat || defaultDateFormat;

  // Set columns
  sheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: 15, // Default width
  }));

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add rows
  const tableRows = rows.map((row) => {
    const rowData: Record<string, any> = {};
    columns.forEach((col) => {
      rowData[col.key] = formatCellValue(row[col.key], col.type, dateFormat);
    });
    return rowData;
  });

  sheet.addRows(tableRows);

  // Apply column formats (dates, numbers) and hyperlinks
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const imageFieldSet = new Set(options?.imageFields || []);

  const resolveLink = (value: any, key: string): { text: string; url: string } | null => {
    if (options?.linkResolver) {
      const res = options.linkResolver(value, key);
      if (res === null) return null;
      if (typeof res === 'string') {
        const url = normalizeUrl(res, origin);
        return { text: url, url };
      }
      return { text: res.text, url: normalizeUrl(res.url, origin) };
    }
    if (typeof value !== 'string' || !value) return null;
    const url = normalizeUrl(value, origin);
    return { text: url, url };
  };

  columns.forEach((col, colIndex) => {
    const excelCol = sheet.getColumn(colIndex + 1);
    if (col.type === 'number') {
      excelCol.numFmt = '#,##0.00';
    } else if (col.type === 'date') {
      excelCol.numFmt = 'yyyy-mm-dd hh:mm';
    }

    // Set hyperlinks for URL/image fields
    const isUrlType = col.type === 'url' || imageFieldSet.has(col.key);
    if (isUrlType) {
      for (let r = 2; r <= rows.length + 1; r++) {
        const cell = sheet.getCell(r, colIndex + 1);
        const raw = rows[r - 2][col.key];
        const val = Array.isArray(raw) ? raw[0] : raw;
        const link = resolveLink(val, col.key);
        if (link) {
          cell.value = { text: link.text, hyperlink: link.url };
          cell.font = { color: { argb: 'FF0000FF' }, underline: true };
        }
      }
    }
  });

  // Add totals row if requested
  if (options?.totals) {
    const totalRowIndex = rows.length + 2;
    const totalRow = sheet.getRow(totalRowIndex);
    totalRow.font = { bold: true };
    
    columns.forEach((col, idx) => {
      if (idx === 0) {
        totalRow.getCell(idx + 1).value = 'Итого:';
      } else if (col.type === 'number') {
        const colLetter = sheet.getColumn(idx + 1).letter;
        totalRow.getCell(idx + 1).value = {
          formula: `SUM(${colLetter}2:${colLetter}${totalRowIndex - 1})`,
        };
      }
    });
  }

  // Autosize columns
  columns.forEach((col, idx) => {
    const maxLength = Math.max(
      col.header.length,
      ...rows.map((row) => {
        const v = row[col.key];
        const s = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
        return s.length;
      })
    );
    sheet.getColumn(idx + 1).width = Math.min(Math.max(maxLength + 4, 12), 40);
  });

  const fileName =
    options?.fileName ||
    `export_${new Date().toISOString().split('T')[0]}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}

function normalizeUrl(value: string, origin: string) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${origin}${value}`;
  return value;
}
