import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { mensajeDeError } from '../mensaje-error';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../../notificacion-snackbar.service';
import { VentaTarjetaService } from '../../venta-tarjeta.service';

export interface CargaManualCuponData {
  /**
   * Registro PENDIENTE a completar.
   *
   * Si viene, el diálogo **completa** contra el filial y cierra devolviendo la venta. Si NO viene
   * --el caso del PDV, donde la venta todavía no se guardó-- el diálogo se limita a **devolver los
   * campos tipeados** y quien lo abrió los guarda junto con la venta. Son los dos momentos en que
   * un cupón se puede cargar, y el formulario es el mismo.
   */
  ventaTarjetaId?: number;
  sucursalId: number;
  /** Cobro al que pertenece el cupón, si el llamador ya lo sabe. */
  cobroDetalleId?: number;
  /** Moneda del cobro. El backend rechaza un cupón en otra moneda. */
  monedaId?: number;
  monedaSimbolo?: string;
  /** Monto cobrado, para que el cajero pueda contrastarlo con lo que tipea. */
  monto?: number;
  terminalDescripcion?: string;
  /** `mapeo` del formato de la terminal. De acá salen los campos obligatorios. */
  mapeo?: string;
}

interface CampoManual {
  clave: string;
  etiqueta: string;
  obligatorio: boolean;
  /** Los importes se tipean con coma o punto; el resto es texto. */
  numerico: boolean;
}

/**
 * Los cuatro campos canónicos que el flujo necesita, con el nombre que el cajero entiende.
 * El orden es el de lectura de un cupón, no el del modelo.
 */
const CAMPOS: CampoManual[] = [
  { clave: 'codigoAutorizacion', etiqueta: 'Código de autorización', obligatorio: false, numerico: false },
  { clave: 'numeroBoleta', etiqueta: 'Número de boleta', obligatorio: false, numerico: false },
  { clave: 'montoEscaneado', etiqueta: 'Monto del cupón', obligatorio: false, numerico: true },
  { clave: 'identificadorTransaccion', etiqueta: 'Referencia del proveedor', obligatorio: false, numerico: false },
];

/**
 * Carga a mano del cupón.
 *
 * <b>Es la salida universal, y por eso existe.</b> El tipo del formato cierra el camino que no
 * corresponde --una terminal WEB no ofrece la cámara, una MAQUINA no ofrece el lector-- y eso sólo
 * es aceptable porque esto está disponible para cualquier tipo, siempre. Antes no existía: el
 * mensaje del filial decía «cargá el cupón a mano» y no había a mano, así que un POS físico sin QR
 * con el OCR fallado dejaba la venta PENDIENTE **y la caja sin poder cerrar**.
 *
 * Sin rol aparte: cualquier cajero puede. Queda el usuario registrado y el chequeo de cupón
 * duplicado corre igual sobre lo tipeado, que es lo que impide retipear el cupón de la venta
 * anterior.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-carga-manual-cupon-dialog',
  templateUrl: './carga-manual-cupon-dialog.component.html',
  styleUrls: ['./carga-manual-cupon-dialog.component.scss'],
})
export class CargaManualCuponDialogComponent implements OnInit {

  formGroup: FormGroup;
  campos: CampoManual[] = [];
  guardando = false;
  error: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CargaManualCuponData,
    public dialogRef: MatDialogRef<CargaManualCuponDialogComponent>,
    private ventaTarjetaService: VentaTarjetaService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.campos = this.camposSegunFormato();
    const controles: { [k: string]: FormControl } = {};
    this.campos.forEach((c) => {
      controles[c.clave] = new FormControl(null, c.obligatorio ? Validators.required : null);
    });
    this.formGroup = new FormGroup(controles);
  }

  /**
   * Qué campos pide el formulario y cuáles son obligatorios: sale del `mapeo` del formato, que es
   * la misma declaración que le dice al OCR qué tiene que encontrar. Una sola fuente de verdad, en
   * vez de tres listas que se desincronizan.
   *
   * Si el mapeo no se puede leer --formato viejo, JSON roto-- se piden los cuatro campos sin
   * obligatorios. Es preferible a no ofrecer nada: la carga a mano es la salida de emergencia y no
   * puede depender de que la configuración esté impecable.
   */
  private camposSegunFormato(): CampoManual[] {
    let mapeo: any = null;
    try {
      mapeo = this.data?.mapeo ? JSON.parse(this.data.mapeo) : null;
    } catch {
      mapeo = null;
    }
    if (!mapeo) return CAMPOS.map((c) => ({ ...c }));

    return CAMPOS.map((c) => ({
      ...c,
      // `monto` en el mapeo es el mismo dato que `montoEscaneado` en la venta.
      obligatorio: mapeo[c.clave === 'montoEscaneado' ? 'monto' : c.clave]?.obligatorio === true,
    }));
  }

  onGuardar(): void {
    if (this.formGroup.invalid || this.guardando) return;
    const v = this.formGroup.value;

    // Sin un PENDIENTE al cual apuntar, el diálogo sólo devuelve lo tipeado: la venta todavía no
    // existe y el guardado lo hace el PDV junto con ella.
    if (this.data.ventaTarjetaId == null) {
      this.dialogRef.close({
        codigoAutorizacion: limpiar(v.codigoAutorizacion),
        numeroBoleta: limpiar(v.numeroBoleta),
        montoEscaneado: aNumero(v.montoEscaneado),
        identificadorTransaccion: limpiar(v.identificadorTransaccion),
        monedaId: this.data.monedaId,
        manual: true,
      });
      return;
    }

    this.guardando = true;
    this.error = null;
    this.ventaTarjetaService
      .onCompletar({
        id: this.data.ventaTarjetaId,
        sucursalId: this.data.sucursalId,
        codigoAutorizacion: limpiar(v.codigoAutorizacion),
        numeroBoleta: limpiar(v.numeroBoleta),
        montoEscaneado: aNumero(v.montoEscaneado),
        identificadorTransaccion: limpiar(v.identificadorTransaccion),
        cobroDetalleId: this.data.cobroDetalleId,
        monedaId: this.data.monedaId,
        // OJO: falta `origen: 'MANUAL'`. La columna vive en la rama
        // `feature/venta-tarjeta-origen` del filial, sin mergear. Mandarlo contra un filial que
        // sólo tiene la entrega A haría que GraphQL rechace la mutation ENTERA por un campo que no
        // existe en el input, y eso rompería también el camino del lector. Se agrega --una línea--
        // cuando esa rama esté mergeada y desplegada.
      })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.notificacionSnackbar.openSucess('Venta con tarjeta registrada');
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.guardando = false;
          // El backend valida lo mismo y devuelve el motivo exacto --cupón duplicado, moneda que
          // no coincide, estado que no es PENDIENTE-- y mostrarlo tal cual le dice al cajero qué
          // hacer, que es lo que un "algo salió mal" no hace.
          this.error = mensajeDeError(err, 'No se pudo registrar el cupón.');
          this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.danger,
            texto: this.error,
            duracion: 8,
          });
        },
      });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}

function limpiar(v: any): string {
  const s = v == null ? '' : String(v).trim();
  return s === '' ? undefined : s;
}

/** Acepta coma o punto como decimal: el cajero tipea lo que ve en el papel. */
function aNumero(v: any): number {
  if (v == null || String(v).trim() === '') return undefined;
  const n = Number(String(v).trim().replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? undefined : n;
}
