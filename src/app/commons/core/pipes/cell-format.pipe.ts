import { Pipe, PipeTransform, Inject, LOCALE_ID } from '@angular/core';
import { DatePipe, DecimalPipe, CurrencyPipe } from '@angular/common';
import { TableData } from '../../../shared/components/search-list-dialog/search-list-dialog.component';

@Pipe({
  name: 'cellFormat'
})
export class CellFormatPipe implements PipeTransform {
  private datePipe: DatePipe;
  private decimalPipe: DecimalPipe;
  private currencyPipe: CurrencyPipe;

  constructor(@Inject(LOCALE_ID) private locale: string) {
    this.datePipe = new DatePipe(this.locale);
    this.decimalPipe = new DecimalPipe(this.locale);
    this.currencyPipe = new CurrencyPipe(this.locale);
  }

  transform(element: any, info: TableData): any {
    // 1. Get the value
    let value: any;
    if (info.nested && info.nestedId != null) {
      // Legacy format: nested + nestedId (e.g. id="nombre", nestedId="persona" -> persona.nombre)
      const path = `${info.nestedId}.${info.id}`;
      value = this.getNestedValue(element, path);
    } else if (info.id.includes('.')) {
      // Dot notation: id contains the full path
      value = this.getNestedValue(element, info.id);
    } else {
      // Direct property access
      value = element[info.id];
    }

    if (value == null) return '';

    // 2. Format the value
    if (!info.pipe) {
      return value;
    }

    switch (info.pipe) {
      case 'date':
        return this.datePipe.transform(value, info.pipeArgs);
      case 'number':
        return this.decimalPipe.transform(value, info.pipeArgs);
      case 'currency':
        return this.currencyPipe.transform(value, info.pipeArgs);
      case 'booleanYesNo':
        return value ? 'SI' : 'NO';
      default:
        return value;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    if (!path || !obj) {
      return null;
    }
    return path.split('.').reduce((p, c) => (p && p[c]) || null, obj);
  }
} 