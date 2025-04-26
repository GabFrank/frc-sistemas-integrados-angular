import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';

@Injectable({
  providedIn: 'root'
})
export class CrearExcelService {

  constructor() { }

  onCreateWorkbook(): ExcelJS.Workbook {
    return new ExcelJS.Workbook();
  }

  onCreateSheet(workbook: ExcelJS.Workbook, sheetName: string): ExcelJS.Workbook {
    workbook.addWorksheet(sheetName);
    return workbook;
  }

  onFillSheet(workbook: ExcelJS.Workbook, sheetName: string, data: any[][]): ExcelJS.Workbook {
    const sheet = workbook.getWorksheet(sheetName);
    sheet.addRows(data);
    return workbook;
  }

  onExport(workbook: ExcelJS.Workbook): void {
    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'example.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  onCreateAndExport(headers, data, filename) {
    let workbook = new ExcelJS.Workbook();
    let sheet = workbook.addWorksheet('sheet');
    sheet.columns = headers.map(header => ({ header, key: header }));
    sheet.addRows(data);
    console.log(workbook);
    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename != null ? `${filename}.xlsx` : `frc-${new Date().toLocaleString()}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
