import { FormGroup } from '@angular/forms';
import { FilaMontoErrores } from './fila-monto-errores.interface';
import { MonedaSelectOpcion } from './moneda-select-opcion.interface';

export interface FilaMontoVista {
  grupo: FormGroup;
  opcionesCurrency: object;
  opcionesMoneda: MonedaSelectOpcion[];
  errores: FilaMontoErrores;
}
