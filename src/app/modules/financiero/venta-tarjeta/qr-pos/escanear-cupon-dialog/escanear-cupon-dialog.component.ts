import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, filter, map } from 'rxjs/operators';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FormatoQrPosService } from '../formato-qr-pos.service';
import { DatosCupon, FormatoQrPos } from '../formato-qr-pos.model';
import {
  DecimalesPorMoneda,
  formatoCruzado,
  MAX_LONGITUD_QR,
  ordenarPorProveedor,
  parsearCupon,
} from '../qr-pos-parser';

export interface EscanearCuponDialogData {
  terminalDescripcion?: string;
  proveedorServicioId?: number;
  monto: number;
  /**
   * Moneda del COBRO — la de la línea que se está pagando, no la de la terminal. El monto que se
   * muestra sale del cobro, así que su símbolo tiene que salir de ahí también: pegarle el símbolo
   * de la terminal mostraba "8.000 R$" para un cobro de 8.000 Gs.
   */
  monedaCobroId?: number;
  monedaSimbolo?: string;
  /** Moneda configurada en la terminal. Si difiere de la del cobro, se avisa antes de escanear. */
  monedaTerminalId?: number;
  monedaTerminalSimbolo?: string;
  decimalesPorMoneda?: DecimalesPorMoneda;
}

/**
 * Paso previo a Finalizar: leer el cupón que el POS imprimió, sin tocar el backend.
 *
 * A diferencia del registro post-venta (RegistrarVentaTarjetaDialogComponent), acá NO hay
 * venta_tarjeta.id todavía — recién existe después de que la venta se guarde. Por eso este
 * diálogo solo parsea la cadena en memoria y devuelve el resultado; la escritura real
 * (crear + completar) la hace venta-touch en un solo golpe cuando la venta se guarda con éxito.
 * Por la misma razón tampoco hay QR para el celular acá: el payload necesita el id de la venta,
 * que todavía no existe.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-escanear-cupon-dialog',
  templateUrl: './escanear-cupon-dialog.component.html',
  styleUrls: ['./escanear-cupon-dialog.component.scss'],
})
export class EscanearCuponDialogComponent implements OnInit {

  cuponControl = new FormControl('');
  formatos: FormatoQrPos[] = [];
  errorLectura: string = null;
  readonly maxLongitud = MAX_LONGITUD_QR;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EscanearCuponDialogData,
    public dialogRef: MatDialogRef<EscanearCuponDialogComponent>,
    private formatoQrPosService: FormatoQrPosService,
    private matDialog: MatDialog
  ) {}

  /**
   * La terminal está configurada en otra moneda que el cobro: se avisa, no bloquea el escaneo.
   * Propiedad plana y no getter: el template la bindea, y el repo prohíbe getters en bindings
   * porque se reevalúan en cada ciclo de detección de cambios.
   */
  avisoMonedaTerminal = '';

  ngOnInit(): void {
    if (
      this.data.monedaTerminalId != null &&
      this.data.monedaCobroId != null &&
      Number(this.data.monedaTerminalId) !== Number(this.data.monedaCobroId)
    ) {
      this.avisoMonedaTerminal =
        `Esta terminal está configurada en ${this.data.monedaTerminalSimbolo || 'otra moneda'} ` +
        `y el cobro es en ${this.data.monedaSimbolo || 'Gs.'}.`;
    }

    this.formatoQrPosService.onGetActivos().pipe(untilDestroyed(this)).subscribe({
      next: (formatos) => (this.formatos = formatos || []),
      error: () => (this.formatos = []),
    });

    // Sin distinctUntilChanged a propósito: tras un cruce de proveedor, "Reintentar" limpia el
    // control con emitEvent:false (para no reprocesar el string vacío) — pero eso deja
    // "recordado" el último valor real que sí se emitió. Si el cajero vuelve a escanear
    // exactamente el mismo cupón (por ejemplo, porque en verdad SÍ era el correcto y confirma
    // igual), distinctUntilChanged lo descartaría en silencio y el diálogo quedaría sin
    // reaccionar. Reprocesar el mismo string dos veces es barato (una sola escaneada manual, no
    // un loop) y es el comportamiento esperado acá.
    this.cuponControl.valueChanges
      .pipe(
        map((v: string) => (v || '').trim()),
        filter((v: string) => v.length > 0),
        debounceTime(250),
        untilDestroyed(this)
      )
      .subscribe((cadena) => this.onCuponLeido(cadena));
  }

  private onCuponLeido(cadena: string): void {
    this.errorLectura = null;

    const ordenados = ordenarPorProveedor(this.formatos, this.data.proveedorServicioId);
    const resultado = parsearCupon(cadena, ordenados, this.data.decimalesPorMoneda || {});
    if (!resultado.ok) {
      this.errorLectura = resultado.error;
      return;
    }

    const datos = resultado.datos;

    // El cruce se chequea ANTES que cualquier otra advertencia: aceptar de más acá es peor que
    // preguntar de más, porque una vez que se completa no hay vuelta atrás fácil.
    // Moneda distinta = error, no advertencia. Comparar 8.000 Gs contra 8.000 R$ da diferencia
    // cero y el registro queda "conciliado" siendo que difiere ~5900x. No hay confirmación
    // posible: un cupón en otra moneda no paga este cobro.
    const monedaCobro = this.data.monedaCobroId;
    if (monedaCobro != null && datos.monedaId != null && Number(datos.monedaId) !== Number(monedaCobro)) {
      this.errorLectura =
        `El cupón está en otra moneda que este cobro (${this.data.monedaSimbolo || 'Gs.'}). ` +
        `No se puede usar para pagarlo.`;
      this.cuponControl.setValue('', { emitEvent: false });
      return;
    }

    if (formatoCruzado(datos.formato, this.data.proveedorServicioId)) {
      this.confirmarCruce(datos);
      return;
    }

    this.aceptar(datos);
  }

  private confirmarCruce(datos: DatosCupon): void {
    const data: ConfirmDialogData = {
      title: 'El cupón no parece ser de esta terminal',
      message:
        `El código coincide con el formato de otro proveedor, no con el de ${this.data.terminalDescripcion || 'esta terminal'}. ` +
        `¿Reintentar el escaneo o confirmar igual?`,
      confirmText: 'Confirmar igual',
      cancelText: 'Reintentar',
    };
    this.matDialog.open(ConfirmDialogComponent, { data, width: '480px' })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (confirmado) {
          this.aceptar(datos);
        } else {
          this.cuponControl.setValue('', { emitEvent: false });
        }
      });
  }

  private aceptar(datos: DatosCupon): void {
    this.dialogRef.close(datos);
  }

  // El aviso de monto distinto / cupón vencido no se muestra acá: en cuanto el parseo da bien,
  // el diálogo cierra en el mismo tick (aceptar() de abajo), así que no alcanzaría a verse. Lo
  // muestra pago-touch como snackbar apenas este diálogo cierra — ver escanearTarjeta().

  onMasTarde(): void {
    this.dialogRef.close(null);
  }
}
