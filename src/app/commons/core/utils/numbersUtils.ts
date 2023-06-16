import { CurrencyMaskInputMode } from 'ngx-currency';

export class NumberUtils { }

export class CurrencyMask {
  separator;
  thousandSeparator;
  decimalSeparator?;
  showMaskTyped?= 'true';
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

  currencyOptionsCantidad = {
    allowNegative: true,
    precision: 2,
    thousands: ',',
    nullable: false,
    inputMode: CurrencyMaskInputMode.NATURAL,
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

export function updateDataSource(dataSourceData: any[], value?: any, index?: number | null): any[] {
  let newArray: any[] = [...dataSourceData];
  if (index != null) {
    if (value != null) {
      // Update the value at the specified index
      newArray[index] = value;
    } else {
      // Delete the value at the specified index
      newArray.splice(index, 1);
    }
  } else {
    if (value != null) {
      // Add the new value to the beginning of the array
      newArray.unshift(value);
    }
  }

  return newArray;
}


export function updateDataSourceWithId(arr, value, id?): any[] {
  if (id != null) {
    let index = arr.findIndex(e => e.id == id);
    if (index != -1) {
      arr[index] = value;
    } else {
      arr.unshift(value);
    }
  }
  return arr;
}

export function updateDataSourceInsertFirst(arr: any[], value): any[] {
  arr.unshift(value);
  return arr;
}

export function stringToInteger(texto: string) {
  let lenght = texto.length;
  let factor = Math.floor((lenght - 1) / 3);
  let auxIndex = lenght;
  for (let index = factor; index > 0; index--) {
    auxIndex -= 3;
    texto = texto.slice(0, auxIndex) + "." + texto.slice(auxIndex);
  }
  return texto;
}

export function stringToDecimal(texto: string) {
  // if(texto[texto.length-1]=='0' && texto[texto.length-2]=='0' && texto[texto.length-3]=='.'){
  //   texto = texto.slice(0, texto.length - 3);
  // }
  if (texto == '0') {
    return '0,00'
  } else {
    texto = texto.replace('.', ',')
    let dotIndex = texto.indexOf(',');
    if (texto[dotIndex + 2] == null) {
      texto = texto + '0';
    }
    texto = stringToInteger(texto.slice(0, texto.length - 3)) + texto.slice(texto.length - 3, texto.length)

    return texto;
  }

}

export function stringToCantidad(texto: string) {
  if (texto[texto.length - 1] == '0' && texto[texto.length - 2] == '0' && texto[texto.length - 3] == '0' && texto[texto.length - 4] == '.') {
    texto = texto.slice(0, texto.length - 4);
  }
  if (texto == '0') {
    return '0,00'
  } else {
    texto = texto.replace('.', ',')
    let dotIndex = texto.indexOf(',');
    if (texto[dotIndex + 2] == null) {
      texto = texto + '0';
    }
    texto = stringToInteger(texto.slice(0, texto.length - 3)) + texto.slice(texto.length - 3, texto.length)

    return texto;
  }

}

export function stringToUnknown(texto: string) {
  if (texto[texto.length - 3] == '.') {
    return stringToDecimal(texto)
  } else {
    return stringToInteger(texto)
  }
}


