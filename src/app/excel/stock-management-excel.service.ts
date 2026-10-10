import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { StockManagementReport } from './excel-report.models';

@Injectable({
  providedIn: 'root'
})
export class StockManagementExcelService {

  public async generateAndDownload(reportData: StockManagementReport): Promise<void> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Stock Management', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 }
      }
    });

    const primaryBlue = 'FF0B3B8C';
    const accentGreen = 'FF0E7C3A';
    const lightBorder = 'FF8EA9DB';
    const white = 'FFFFFFFF';
    const darkGray = 'FF333333';
    const rowAltBlue = 'FFF4F7FC';

    const applyMergedBorder = (sRow: number, eRow: number, sCol: number, eCol: number, borderDef: any) => {
      for (let r = sRow; r <= eRow; r++) {
        for (let c = sCol; c <= eCol; c++) {
          ws.getCell(r, c).border = {
            top: r === sRow ? borderDef.top : undefined,
            bottom: r === eRow ? borderDef.bottom : undefined,
            left: c === sCol ? borderDef.left : undefined,
            right: c === eCol ? borderDef.right : undefined
          } as any;
        }
      }
    };

    const fontTitle = { name: 'Calibri', size: 22, bold: true, color: { argb: primaryBlue } };
    const fontNormal = { name: 'Calibri', size: 11, color: { argb: darkGray } };
    const fontBold = { name: 'Calibri', size: 11, bold: true, color: { argb: darkGray } };
    const fontHeader = { name: 'Calibri', size: 11, bold: true, color: { argb: white } };
    const cellBorderThin = {
      top: { style: 'thin', color: { argb: lightBorder } },
      left: { style: 'thin', color: { argb: lightBorder } },
      bottom: { style: 'thin', color: { argb: lightBorder } },
      right: { style: 'thin', color: { argb: lightBorder } }
    } as any;

    const totalCols = 10;
    const lastCol = 'J';
    const colWidths = [
      8,  // A: S.NO
      16, // B: DATE
      14, // C: TYPE
      18, // D: DC NO
      32, // E: COMPANY
      16, // F: STYLE NO
      26, // G: DESIGN NAME
      16, // H: COLOUR
      16, // I: INWARD QTY
      16  // J: OUTWARD QTY
    ];

    for (let c = 1; c <= totalCols; c++) {
      ws.getColumn(c).width = colWidths[c - 1];
    }

    let logoId: number | undefined;
    try {
      const res = await fetch('/logo.jpg');
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        logoId = wb.addImage({
          buffer: buffer,
          extension: 'jpeg',
        });
      }
    } catch (e) {
      console.warn('Could not fetch logo.jpg for Excel generation', e);
    }

    ws.mergeCells('A1:B2');
    ws.getRow(1).height = 24;
    ws.getRow(2).height = 24;
    if (logoId !== undefined) {
      ws.addImage(logoId, 'A1:B2');
    } else {
      const logoCell = ws.getCell('A1');
      logoCell.value = 'S.S.E\nLOGO';
      logoCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: primaryBlue } };
      logoCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }
    applyMergedBorder(1, 2, 1, 2, cellBorderThin);

    ws.mergeCells(`C1:${lastCol}2`);
    ws.getCell('C1').value = 'S.S. EMBROIDERY';
    ws.getCell('C1').font = fontTitle;
    ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
    applyMergedBorder(1, 2, 3, totalCols, cellBorderThin);

    const summary = reportData.summary || {};
    const inwardQty = Number(summary.totalInwardQty) || 0;
    const outwardQty = Number(summary.totalOutwardQty) || 0;
    const availableQty = summary.availableStock !== undefined && summary.availableStock !== null
      ? Number(summary.availableStock)
      : inwardQty - outwardQty;

    const summaryBoxes = [
      { start: 1, end: 4, title: 'TOTAL INWARD QTY', value: inwardQty, color: accentGreen },
      { start: 5, end: 7, title: 'TOTAL OUTWARD QTY', value: outwardQty, color: primaryBlue },
      { start: 8, end: 10, title: 'AVAILABLE STOCK', value: availableQty, color: accentGreen }
    ];

    summaryBoxes.forEach(box => {
      ws.mergeCells(4, box.start, 6, box.end);
      const cell = ws.getCell(4, box.start);
      cell.value = {
        richText: [
          { text: `${box.title}\n`, font: { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF555555' } } },
          { text: box.value.toLocaleString(), font: { name: 'Calibri', size: 18, bold: true, color: { argb: box.color } } }
        ]
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      applyMergedBorder(4, 6, box.start, box.end, cellBorderThin);
    });
    ws.getRow(4).height = 18;
    ws.getRow(5).height = 22;
    ws.getRow(6).height = 18;

    let rowIdx = 8;
    ws.mergeCells(`A${rowIdx}:${lastCol}${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = 'LATEST TRANSACTIONS';
    ws.getCell(`A${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryBlue } };
    ws.getCell(`A${rowIdx}`).font = { name: 'Calibri', size: 12, bold: true, color: { argb: white } };
    ws.getCell(`A${rowIdx}`).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(rowIdx).height = 22;

    rowIdx++;
    const transHeaders = ['S.NO', 'DATE', 'TYPE', 'DC NO', 'COMPANY', 'STYLE NO', 'DESIGN NAME', 'COLOUR', 'INWARD QTY', 'OUTWARD QTY'];
    ws.insertRow(rowIdx, transHeaders);
    ws.getRow(rowIdx).height = 20;

    for (let c = 1; c <= totalCols; c++) {
      const hc = ws.getCell(rowIdx, c);
      hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryBlue } };
      hc.font = fontHeader;
      hc.alignment = { horizontal: 'center', vertical: 'middle' };
      hc.border = cellBorderThin;
    }

    const headerRow = rowIdx;
    ws.autoFilter = `A${headerRow}:${lastCol}${headerRow}`;
    ws.views = [{ state: 'frozen', ySplit: headerRow }];
    rowIdx++;

    let sno = 1;
    let sumInward = 0;
    let sumOutward = 0;

    if (reportData.transactions && reportData.transactions.length > 0) {
      reportData.transactions.forEach(t => {
        const d = new Date(t.date || t.createdDate);
        const formattedDate = !isNaN(d.getTime())
          ? `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`
          : '';

        const inQty = t.inwardQty || 0;
        const outQty = t.outwardQty || 0;
        sumInward += inQty;
        sumOutward += outQty;

        const rowData = [
          sno++,
          formattedDate,
          t.type,
          t.dcNo || '-',
          t.companyName || '-',
          t.styleNo || '-',
          t.designName || '-',
          t.color || '-',
          inQty,
          outQty
        ];
        ws.insertRow(rowIdx, rowData);

        for (let c = 1; c <= totalCols; c++) {
          const cell = ws.getCell(rowIdx, c);
          cell.border = cellBorderThin;

          if (rowIdx % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowAltBlue } };
          }

          cell.font = fontNormal;

          if (c === 1 || c === 2) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (c >= 9) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0';
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }

          if (c === 3) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            if (t.type === 'INWARD') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: accentGreen } };
            } else if (t.type === 'OUTWARD') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC00000' } };
            }
          }

          if (c === 9 && inQty > 0) {
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: accentGreen } };
          }
          if (c === 10 && outQty > 0) {
            cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFC00000' } };
          }
        }
        rowIdx++;
      });
    } else {
      ws.mergeCells(`A${rowIdx}:${lastCol}${rowIdx}`);
      ws.getCell(`A${rowIdx}`).value = 'No Records Found';
      ws.getCell(`A${rowIdx}`).font = fontBold;
      ws.getCell(`A${rowIdx}`).alignment = { horizontal: 'center', vertical: 'middle' };
      for (let c = 1; c <= totalCols; c++) {
        ws.getCell(rowIdx, c).border = cellBorderThin;
      }
      rowIdx++;
    }

    ws.mergeCells(`A${rowIdx}:H${rowIdx}`);
    ws.getCell(`A${rowIdx}`).value = 'TOTALS';

    const totalFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryBlue } } as any;
    for (let c = 1; c <= totalCols; c++) {
      const tc = ws.getCell(rowIdx, c);
      tc.fill = totalFill;
      tc.border = cellBorderThin;
      tc.font = { name: 'Calibri', size: 12, bold: true, color: { argb: white } };
      tc.alignment = {
        horizontal: c <= 8 ? 'center' : 'right',
        vertical: 'middle'
      };
    }

    ws.getCell(rowIdx, 9).value = sumInward;
    ws.getCell(rowIdx, 9).numFmt = '#,##0';
    ws.getCell(rowIdx, 10).value = sumOutward;
    ws.getCell(rowIdx, 10).numFmt = '#,##0';

    await this.finalizeAndDownload(wb, 'Stock_Management_Report');
  }

  private async finalizeAndDownload(wb: ExcelJS.Workbook, baseName: string) {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const now = new Date();
    const ts = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    saveAs(blob, `${baseName}_${ts}.xlsx`);
  }
}
