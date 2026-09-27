import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AdvanceAmount } from '../core/services/advance-amount.service';

@Injectable({
  providedIn: 'root'
})
export class AdvanceAmountExcelService {

  public async generateAndDownload(data: AdvanceAmount[]): Promise<void> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Advance Amount', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 }
      },
      headerFooter: { oddFooter: '&LReport Generated On: &D &T&CThis is a system generated report.&RPage &P of &N' }
    });

    const primaryBlue = 'FF0B3B8C';
    const white = 'FFFFFFFF';
    const darkGray = 'FF333333';
    const lightBorder = 'FF8EA9DB'; 
    const rowAltBlue = 'FFF4F7FC';

    const fontHeader = { name: 'Calibri', size: 12, bold: true, color: { argb: white } };
    const fontNormal = { name: 'Calibri', size: 11, color: { argb: darkGray } };
    const cellBorderThin = { top: { style: 'thin', color: { argb: lightBorder } }, left: { style: 'thin', color: { argb: lightBorder } }, bottom: { style: 'thin', color: { argb: lightBorder } }, right: { style: 'thin', color: { argb: lightBorder } } } as any;

    const totalCols = 6;
    const colWidths = [8, 30, 15, 15, 40, 15]; // S.NO, Name, Date, Amount, Remarks, Action(placeholder)
    
    for (let c = 1; c <= totalCols; c++) {
        ws.getColumn(c).width = colWidths[c - 1];
    }

    // Title
    ws.mergeCells('A1:E2');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'ADVANCE AMOUNT REPORT';
    titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: primaryBlue } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    let rowIdx = 4;
    const transHeaders = ['S.NO', 'NAME', 'DATE', 'AMOUNT (₹)', 'REMARKS'];
    ws.insertRow(rowIdx, transHeaders);
    
    for (let c = 1; c <= 5; c++) {
      const hc = ws.getCell(rowIdx, c);
      hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryBlue } };
      hc.font = fontHeader;
      hc.alignment = { horizontal: 'center', vertical: 'middle' };
      hc.border = cellBorderThin;
    }
    
    rowIdx++;

    let sno = 1;
    let totalAmount = 0;

    if (data && data.length > 0) {
      data.forEach(t => {
        totalAmount += t.amount;
        const rowData = [sno++, t.name, t.date, t.amount, t.remarks || ''];
        ws.insertRow(rowIdx, rowData);
        
        for (let c = 1; c <= 5; c++) {
          const cell = ws.getCell(rowIdx, c);
          cell.border = cellBorderThin;
          if (rowIdx % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowAltBlue } };
          }
          cell.font = fontNormal;
          
          if (c === 1 || c === 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
          else if (c === 4) cell.alignment = { horizontal: 'right', vertical: 'middle' };
          else cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
        rowIdx++;
      });

      // Total Row
      ws.mergeCells(`A${rowIdx}:C${rowIdx}`);
      ws.getCell(`A${rowIdx}`).value = 'TOTAL';
      for(let c=1; c<=5; c++) {
        const cell = ws.getCell(rowIdx, c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryBlue } };
        cell.border = cellBorderThin;
        cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: white } };
        if (c === 4) {
           cell.value = totalAmount;
           cell.alignment = { horizontal: 'right', vertical: 'middle' };
        } else if (c <= 3) {
           cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
    } else {
        ws.mergeCells(`A${rowIdx}:E${rowIdx}`);
        ws.getCell(`A${rowIdx}`).value = 'No Records Found';
        ws.getCell(`A${rowIdx}`).font = fontNormal;
        ws.getCell(`A${rowIdx}`).alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getCell(`A${rowIdx}`).border = cellBorderThin;
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
    saveAs(blob, `Advance_Amount_${dateStr}.xlsx`);
  }
}
