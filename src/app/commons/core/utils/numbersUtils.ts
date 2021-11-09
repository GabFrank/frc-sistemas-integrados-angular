import { CurrencyMaskInputMode } from 'ngx-currency';

export class NumberUtils {}

export class CurrencyMask {
  separator;
  thousandSeparator;
  decimalSeparator?;
  showMaskTyped? = 'true';
  currencyOptionsGuarani = {
    allowNegative: true,
    precision: 0,
    thousands: '.',
    nullable: false,
    inputMode: CurrencyMaskInputMode.NATURAL,
    align: 'right',
    allowZero: true,
    decimal: null,
    prefix: '',
    suffix: '',
    max: null,
    min: null,
  };

  currencyOptionsNoGuarani = {
    allowNegative: true,
    precision: 2,
    thousands: ',',
    nullable: false,
    inputMode: CurrencyMaskInputMode.FINANCIAL,
    align: 'right',
    allowZero: true,
    decimal: '.',
    prefix: '',
    suffix: '',
    max: null,
    min: null,
  };
}

export function isInt(n) {
  return n % 1 === 0;
}

export function updateDataSource(arr, value, index?){
  let aux: any[] = arr;
  if(index!=null){
    aux[index] = value
  } else {
    aux.push(value)
  }
  return aux;
}
