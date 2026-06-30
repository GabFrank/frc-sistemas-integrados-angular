import { Pipe, PipeTransform } from '@angular/core';
import { etiquetaModuloPadre } from '../utils/tipo-gasto-modulo-reglas.util';

@Pipe({
  name: 'etiquetaModuloPadre',
})
export class EtiquetaModuloPadrePipe implements PipeTransform {
  transform(modulo?: string | null): string {
    return etiquetaModuloPadre(modulo);
  }
}
