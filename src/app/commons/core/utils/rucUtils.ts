export function getDigitoVerificadorString(ruc: string): string {
    const digito = getDigitoVerificadorWithBase(ruc, 11);
    if (digito !== null) {
        return ` - ${digito}`;
    }
    return '';
}

function getDigitoVerificadorWithBase(ruc: string, base: number): number | null {
    if (ruc.length < 6) return null;
    let k = 2;
    let total = 0;
    const alRevez = invertirCadena(eliminarNoDigitos(ruc));

    for (const numero of alRevez) {
        total += (numero.charCodeAt(0) - '0'.charCodeAt(0)) * k++;

        if (k > base) {
            k = 2;
        }
    }

    const resto = total % base;
    return resto > 1 ? base - resto : 0;
}

function invertirCadena(ruc: string): string {
    return ruc.split('').reverse().join('');
}

/**
 * Elimina todos los no digitos de la cadena.
 *
 * @param ruc ruc con numeros, simbolos y letras.
 * @return una versión del ruc consistente de solo digitos.
 */
function eliminarNoDigitos(ruc: string): string {
    let toRet = '';
    for (const c of ruc) {
        if (/\d/.test(c)) {
            toRet += c;
        } else {
            toRet += c.charCodeAt(0);
        }
    }
    return toRet;
}

export function removeSecondDigito(ruc: string): string {
  if (ruc != null && ruc.includes('-')) {
      let aux = ruc.replace('-', '');
      if(aux.includes('-')){
          return ruc.substring(0, ruc.length - 2)
      }
  } else {
      return ruc;
  }
}
