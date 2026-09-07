import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { interval } from 'rxjs';
import { debounceTime, filter, map, switchMap } from 'rxjs/operators';
import { codificarQr, QrData } from '../../../../../shared/qr-code/qr-code.component';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../../notificacion-snackbar.service';
import { VentaTarjetaService } from '../../venta-tarjeta.service';
import { CobroDetalleDeVenta } from '../../graphql/cobrosTarjetaDeVenta';
import { mensajeDeError } from '../mensaje-error';
import { FormatoQrPosService } from '../formato-qr-pos.service';
import { DatosCupon, FormatoQrPos } from '../formato-qr-pos.model';
import {
  cuponVencido,
  DecimalesPorMoneda,
  HORAS_ANTIGUEDAD_MAXIMA,
  MAX_LONGITUD_QR,
  ordenarPorProveedor,
  parsearCupon,
} from '../qr-pos-parser';

export interface RegistrarVentaTarjetaData {
  /** Id del venta_tarjeta PENDIENTE que creó el PDV. */
  ventaTarjetaId: number;
  sucursalId: number;
  /** Venta a la que pertenece el pendiente: se usa para traer sus cobros con tarjeta. */
  ventaId?: number;
  /** Payload del QR que lee la app móvil (camino de la foto + OCR). */
  qrPayload: QrData;
  /** Monto cobrado, para contrastarlo con el del cupón. */
  monto: number;
  /** Símbolo de la moneda de la TERMINAL: el cupón viene en la moneda del POS. */
  monedaSimbolo?: string;
  terminalDescripcion?: string;
  /** Proveedor de la terminal escaneada: define qué formato se prueba primero. */
  proveedorServicioId?: number;
  /** Decimales por moneda, para escalar importes en la menor unidad. */
  decimalesPorMoneda?: DecimalesPorMoneda;
  titulo?: string;
  /** Segundos hasta el cierre automático. */
  segundos?: number;
}

export type RegistrarVentaTarjetaResultado = 'COMPLETADO' | 'MAS_TARDE';

/**
 * Los dos caminos para registrar una venta con tarjeta, en un solo diálogo.
 *
 *   1. Escanear con el lector del PDV el QR que imprime el POS en el cupón. Es el camino nuevo y
 *      el rápido: no requiere celular ni OCR.
 *   2. Escanear con el celular el QR de la pantalla, que abre la captura de imagen. Es el camino
 *      que ya existía, y sigue siendo el único para los proveedores que todavía no imprimen QR.
 *
 * Un solo diálogo con los dos, en vez de un flag por terminal: los proveedores van a ir
 * adoptando el QR de a uno, y así no hay que tocar la configuración de cada maquinita ni
 * migrar nada cuando el siguiente se sume.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-registrar-venta-tarjeta-dialog',
  templateUrl: './registrar-venta-tarjeta-dialog.component.html',
  styleUrls: ['./registrar-venta-tarjeta-dialog.component.scss'],
})
export class RegistrarVentaTarjetaDialogComponent implements OnInit, OnDestroy {

  valorQr = '';
  cuponControl = new FormControl('');
  formatos: FormatoQrPos[] = [];
  procesando = false;
  errorLectura: string = null;
  countdown: number = null;

  /** Cobros con TARJETA de la venta entre los que el usuario tiene que elegir. */
  candidatos: CobroDetalleDeVenta[] = [];
  cobroElegidoId: number = null;
  /** Datos ya leídos del cupón, esperando que se elija el cobro. */
  private pendienteDeVincular: { datos: DatosCupon; advertencias: string[] } = null;

  private timer;

  readonly maxLongitud = MAX_LONGITUD_QR;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RegistrarVentaTarjetaData,
    public dialogRef: MatDialogRef<RegistrarVentaTarjetaDialogComponent>,
    private ventaTarjetaService: VentaTarjetaService,
    private formatoQrPosService: FormatoQrPosService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private matDialog: MatDialog
  ) {
    this.valorQr = codificarQr(data.qrPayload);
    if (data.segundos != null) {
      this.countdown = data.segundos;
      this.timer = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(this.timer);
          // Se agotó el tiempo sin registrar: es exactamente "lo hago más tarde". El registro
          // queda PENDIENTE y el cierre de caja lo va a reclamar.
          this.cerrar('MAS_TARDE');
        }
      }, 1000);
    }
  }

  ngOnInit(): void {
    this.formatoQrPosService.onGetActivos().pipe(untilDestroyed(this)).subscribe({
      next: (formatos) => (this.formatos = formatos || []),
      // Sin formatos el input no sirve, pero el camino del celular sigue disponible: no se
      // bloquea el diálogo por esto.
      error: () => (this.formatos = []),
    });

    // El lector es keyboard-wedge: escribe la cadena de un saque y normalmente cierra con Enter.
    // No se depende del Enter (ver el defecto del diálogo de terminal): el debounce alcanza.
    this.cuponControl.valueChanges
      .pipe(
        map((v: string) => (v || '').trim()),
        filter((v: string) => v.length > 0),
        debounceTime(250),
        // Sin distinctUntilChanged a propósito: si la primera lectura falló (por ejemplo, los
        // formatos todavía no habían llegado del backend), volver a pasar el MISMO cupón tiene
        // que reintentar. Con el operador puesto, ese segundo escaneo se descartaba en silencio.
        untilDestroyed(this)
      )
      .subscribe((cadena) => this.onCuponLeido(cadena));

    // El otro camino sigue vivo: si el registro lo completa la app móvil, el diálogo se entera
    // y se cierra solo.
    interval(3000)
      .pipe(
        switchMap(() =>
          this.ventaTarjetaService.onGetEstadoPorId(this.data.ventaTarjetaId, this.data.sucursalId)
        ),
        untilDestroyed(this)
      )
      .subscribe((vt) => {
        if (vt && vt.estado && vt.estado !== 'PENDIENTE') {
          this.avisarSegunEstado(vt.estado);
          this.cerrar(vt.estado === 'COMPLETADO' ? 'COMPLETADO' : 'MAS_TARDE');
        }
      });
  }

  /**
   * El diálogo se abre con `disableClose: false`, así que ESC o un click en el backdrop lo
   * destruyen sin pasar por `cerrar()` — que era el único lugar que hacía clearInterval. Cada
   * cierre por esa vía dejaba el countdown corriendo en el vacío.
   */
  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onCuponLeido(cadena: string): void {
    if (this.procesando) return;
    this.errorLectura = null;

    const ordenados = ordenarPorProveedor(this.formatos, this.data.proveedorServicioId);
    const resultado = parsearCupon(cadena, ordenados, this.data.decimalesPorMoneda || {});
    if (!resultado.ok) {
      this.errorLectura = resultado.error;
      return;
    }

    const datos = resultado.datos;
    const advertencias = this.revisar(datos);

    // Una diferencia de monto se confirma ANTES de escribir, no se avisa después. El registro
    // guarda un cupón contra un cobro concreto: si no coinciden, o el cajero escaneó el cupón
    // equivocado (lo más común) o hay algo raro con el POS. En los dos casos tiene que verlo y
    // decidir, no enterarse cuando ya está guardado.
    if (advertencias.length) {
      this.confirmarDiferencias(datos, advertencias);
      return;
    }
    this.resolverCobroYCompletar(datos, advertencias);
  }

  private confirmarDiferencias(datos: DatosCupon, advertencias: string[]): void {
    const data: ConfirmDialogData = {
      title: 'El cupón no coincide con este cobro',
      message: `Este cobro es de ${this.data.monto?.toLocaleString('es-PY')} ` +
        `${this.data.monedaSimbolo || 'Gs.'} en ${this.data.terminalDescripcion || 'esta terminal'}, ` +
        `pero ${advertencias.join(' y ')}. ¿Es el cupón correcto?`,
      confirmText: 'Registrar igual',
      cancelText: 'Escanear otro',
    };
    this.matDialog.open(ConfirmDialogComponent, { data, width: '520px' })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (!confirmado) {
          // Vuelve a esperar una lectura. Se limpia sin emitir para no re-disparar el parseo con
          // la misma cadena.
          this.cuponControl.setValue('', { emitEvent: false });
          this.errorLectura = null;
          return;
        }
        this.resolverCobroYCompletar(datos, advertencias);
      });
  }

  /**
   * Antes de completar, decide a qué cobro de la venta pertenece este cupón.
   *
   * Con un solo cobro con tarjeta libre no hay nada que preguntar. Con dos o más, el backend no
   * puede desempatarlos si son del mismo monto y hoy no vincula ninguno: el dato del cupón queda
   * guardado pero la conciliación se pierde. Por eso acá se FRENA y se obliga a elegir.
   *
   * Si la consulta de cobros falla no se bloquea el registro: se completa sin cobroDetalleId y
   * el backend hace lo que pueda. Perder el vínculo es malo; perder el registro del cupón, peor.
   */
  private resolverCobroYCompletar(datos: DatosCupon, advertencias: string[]): void {
    if (!this.data.ventaId) {
      this.completar(datos, advertencias);
      return;
    }

    this.procesando = true;
    this.ventaTarjetaService
      .onGetCobrosTarjetaDeVenta(this.data.ventaId, this.data.sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (cobros) => {
          this.procesando = false;
          const libres = (cobros || []).filter(
            (c) => !c.identificadorTransaccion || !c.identificadorTransaccion.trim()
          );

          if (libres.length === 1) {
            this.completar(datos, advertencias, libres[0].id);
            return;
          }
          if (libres.length === 0) {
            // Nada libre que vincular: se registra igual y el backend decide.
            this.completar(datos, advertencias);
            return;
          }

          // Dos o más: el usuario elige. El diálogo no se cierra hasta que confirme.
          this.candidatos = libres;
          this.cobroElegidoId = null;
          this.pendienteDeVincular = { datos, advertencias };
          this.detenerCountdown();
          // El cupón ya está leído pero todavía no escrito: un click en el backdrop o un ESC
          // lo tiraría en silencio y el cajero se quedaría creyendo que registró algo. La
          // única salida a partir de acá es elegir, o descartarlo diciéndolo explícitamente.
          this.dialogRef.disableClose = true;
        },
        error: () => {
          this.procesando = false;
          this.completar(datos, advertencias);
        },
      });
  }

  /** Confirmación del usuario: recién acá se escribe el vínculo. */
  confirmarCobroElegido(): void {
    if (this.cobroElegidoId == null || !this.pendienteDeVincular) return;
    const { datos, advertencias } = this.pendienteDeVincular;
    this.pendienteDeVincular = null;
    this.candidatos = [];
    this.dialogRef.disableClose = false;
    this.completar(datos, advertencias, this.cobroElegidoId);
  }

  /**
   * Salida explícita del selector. Existe para no dejar al usuario encerrado, pero dice lo que
   * hace: el cupón leído se descarta y el registro sigue PENDIENTE. Es una decisión tomada,
   * no un click al voleo en el backdrop.
   */
  descartarCuponLeido(): void {
    this.pendienteDeVincular = null;
    this.candidatos = [];
    this.cobroElegidoId = null;
    this.dialogRef.disableClose = false;
    this.cuponControl.setValue('', { emitEvent: false });
    this.notificacionSnackbar.notification$.next({
      color: NotificacionColor.warn,
      texto: 'Cupón descartado. La venta con tarjeta sigue pendiente de registrar.',
      duracion: 5,
    });
    this.cerrar('MAS_TARDE');
  }

  /** El countdown no puede cerrar el diálogo mientras se espera una decisión del usuario. */
  private detenerCountdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.countdown = null;
  }

  /**
   * Lo que no cuadra se avisa pero no bloquea. El cliente ya pagó y el cupón ya está impreso:
   * negarse a registrar deja la caja peor que registrar con una advertencia, porque el pendiente
   * termina cerrándose como NO COMPLETADO y se pierde el dato.
   */
  private revisar(datos: DatosCupon): string[] {
    const avisos: string[] = [];
    if (datos.monto != null && this.data.monto != null && datos.monto !== this.data.monto) {
      avisos.push(
        `el cupón dice ${datos.monto.toLocaleString('es-PY')} y se cobró ${this.data.monto.toLocaleString('es-PY')}`
      );
    }
    if (cuponVencido(datos.fecha)) {
      avisos.push(`el cupón tiene más de ${HORAS_ANTIGUEDAD_MAXIMA} horas`);
    }
    return avisos;
  }

  private completar(datos: DatosCupon, advertencias: string[], cobroDetalleId?: number): void {
    this.procesando = true;
    this.ventaTarjetaService
      .onCompletar({
        cobroDetalleId,
        monedaId: datos.monedaId,
        id: this.data.ventaTarjetaId,
        sucursalId: this.data.sucursalId,
        codigoAutorizacion: datos.codigoAutorizacion,
        numeroBoleta: datos.numeroBoleta,
        montoEscaneado: datos.monto,
        identificadorTransaccion: datos.identificadorTransaccion,
        qrCrudo: datos.qrCrudo,
      })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.procesando = false;
          if (advertencias.length) {
            this.notificacionSnackbar.notification$.next({
              color: NotificacionColor.warn,
              texto: `Venta con tarjeta registrada, pero ${advertencias.join(' y ')}.`,
              duracion: 8,
            });
          } else {
            this.notificacionSnackbar.notification$.next({
              color: NotificacionColor.success,
              texto: 'Venta con tarjeta registrada.',
              duracion: 3,
            });
          }
          this.cerrar('COMPLETADO');
        },
        error: (err) => {
          this.procesando = false;
          // El error del backend se muestra tal cual: dice si el registro ya estaba completado,
          // cancelado o cerrado por caja, que es justo lo que el cajero necesita saber.
          this.errorLectura = mensajeDeError(err, 'No se pudo registrar la venta con tarjeta.');
          // La lectura falló: el campo vuelve a quedar listo para el cupón correcto.
          this.cuponControl.setValue('', { emitEvent: false });
        },
      });
  }

  private avisarSegunEstado(estado: string): void {
    if (estado === 'COMPLETADO') {
      this.notificacionSnackbar.notification$.next({
        color: NotificacionColor.success,
        texto: 'Venta con tarjeta registrada desde el celular.',
        duracion: 3,
      });
    } else {
      this.notificacionSnackbar.notification$.next({
        color: NotificacionColor.warn,
        texto: `La venta con tarjeta quedó en estado ${estado}.`,
        duracion: 5,
      });
    }
  }

  /** "Registrar más tarde": la venta ya está cerrada; el registro queda PENDIENTE. */
  onMasTarde(): void {
    this.notificacionSnackbar.notification$.next({
      color: NotificacionColor.warn,
      texto: 'Queda pendiente de registrar. No vas a poder cerrar la caja hasta resolverlo.',
      duracion: 6,
    });
    this.cerrar('MAS_TARDE');
  }

  private cerrar(resultado: RegistrarVentaTarjetaResultado): void {
    if (this.timer) clearInterval(this.timer);
    this.dialogRef.close(resultado);
  }
}
