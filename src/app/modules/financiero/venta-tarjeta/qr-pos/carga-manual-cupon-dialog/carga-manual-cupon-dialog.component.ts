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

  /**
   * Lo que el OCR ya leyó, para precargar el formulario. Las claves son las canónicas del cupón
   * (`monto`, no `montoEscaneado`).
   *
   * Cuando viene, este diálogo deja de ser "cargá todo a mano" y pasa a ser "confirmá esto". Es
   * la diferencia de fricción que justifica toda la etapa.
   */
  valores?: { [clave: string]: any };

  /**
   * Confianza 0..1 por campo canónico, del OCR.
   *
   * **Un campo que no está acá es un campo del que no se sabe**, y se trata igual que uno de
   * confianza baja: hay que confirmarlo. Son distintos motivos para preguntar, misma acción.
   */
  confianzas?: { [campo: string]: number };

  /**
   * Token de la captura que produjo estos datos. Viaja hasta `completar` para que la foto quede
   * atada a la venta: es lo que después impide que la purga se lleve puesta la evidencia de un
   * cobro.
   */
  capturaToken?: string;

  /** De dónde salieron los datos. Sin esto, `venta_tarjeta.origen` queda nulo. */
  origen?: 'QR' | 'OCR' | 'MANUAL';

  /**
   * Los campos que el cupón trae y que no tienen columna propia, como JSON.
   *
   * No se muestran en el formulario —no hay dónde— pero **sí se guardan**: son los campos propios
   * del proveedor que `venta_tarjeta.datos_extra` existe para conservar.
   */
  datosExtra?: string;
}

interface CampoManual {
  clave: string;
  etiqueta: string;
  obligatorio: boolean;
  /** Los importes se tipean con coma o punto; el resto es texto. */
  numerico: boolean;
  /** La clave con la que el OCR devuelve este mismo dato. Sólo difiere en el monto. */
  claveOcr?: string;

  // ── Semáforo. Se calcula una vez en ngOnInit: el template no puede llamar funciones. ──
  /** El OCR lo leyó con confianza suficiente: viene cargado y no hace falta tocarlo. */
  bueno?: boolean;
  /** El OCR lo leyó mal, o no se sabe cuánto se le puede creer. Hay que confirmarlo. */
  dudoso?: boolean;
  /** Lo que el OCR leyó, tal cual. Sirve para detectar si el cajero lo corrigió. */
  leido?: string;
  /** Texto del semáforo, ya armado. */
  pista?: string;
}

/**
 * A partir de cuánta confianza un campo se da por bueno y no se pregunta.
 *
 * El motor devuelve valores muy polarizados: una línea bien reconocida ronda 0,95+ y una dudosa
 * cae bastante por debajo. 0,90 deja pasar la lectura limpia y pregunta la borrosa, que es el
 * reparto que esta pantalla necesita.
 *
 * Si alguna vez hay que afinarlo por empresa, el lugar es `configuracion_venta_tarjeta`, que ya
 * es la tabla de las perillas del módulo. Hoy no vale una migración en los dos repos.
 */
const CONFIANZA_MINIMA = 0.9;

/**
 * Los cuatro campos canónicos que el flujo necesita, con el nombre que el cajero entiende.
 * El orden es el de lectura de un cupón, no el del modelo.
 */
const CAMPOS: CampoManual[] = [
  { clave: 'codigoAutorizacion', etiqueta: 'Código de autorización', obligatorio: false, numerico: false, claveOcr: 'codigoAutorizacion' },
  { clave: 'numeroBoleta', etiqueta: 'Número de boleta', obligatorio: false, numerico: false, claveOcr: 'numeroBoleta' },
  // `monto` en el cupón es el mismo dato que `montoEscaneado` en la venta.
  { clave: 'montoEscaneado', etiqueta: 'Monto del cupón', obligatorio: false, numerico: true, claveOcr: 'monto' },
  { clave: 'identificadorTransaccion', etiqueta: 'Referencia del proveedor', obligatorio: false, numerico: false, claveOcr: 'identificadorTransaccion' },
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

  /**
   * El diálogo viene con datos del OCR, así que el trabajo es confirmar y no transcribir.
   * Propiedad plana: el template la bindea y el repo prohíbe getters en bindings.
   */
  esConfirmacion = false;

  /** Los campos dudosos que el cajero todavía no confirmó ni corrigió. */
  faltaConfirmar = 0;

  /** Marcas de "coincide con el ticket", por clave de campo. */
  confirmado: { [clave: string]: boolean } = {};

  titulo = 'Cargar el cupón a mano';
  ayuda = 'Copiá los datos del ticket. Los campos marcados con * son los que este aparato necesita para que la operación sirva.';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CargaManualCuponData,
    public dialogRef: MatDialogRef<CargaManualCuponDialogComponent>,
    private ventaTarjetaService: VentaTarjetaService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.campos = this.camposSegunFormato();
    this.esConfirmacion = this.data?.origen === 'OCR' && this.data?.valores != null;

    const controles: { [k: string]: FormControl } = {};
    this.campos.forEach((c) => {
      controles[c.clave] = new FormControl(
        this.valorLeido(c),
        c.obligatorio ? Validators.required : null
      );
    });
    this.formGroup = new FormGroup(controles);

    if (this.esConfirmacion) {
      this.prepararSemaforo();
      this.titulo = 'Confirmá los datos del cupón';
      this.ayuda =
        'El lector ya completó lo que pudo leer con seguridad. Revisá contra el ticket los campos ' +
        'marcados en ámbar: son los que no se leyeron con claridad.';
      // El botón se habilita cuando no queda nada dudoso sin confirmar, así que hay que
      // recalcular con cada tecla: corregir un valor cuenta como confirmarlo.
      this.formGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.recalcular());
      this.recalcular();
    }
  }

  /**
   * Qué le creemos a cada campo.
   *
   * <b>Dudoso no es sólo "confianza baja".</b> Un campo sin entrada en `confianzas` es un campo
   * del que no se sabe --el patrón no lo capturó, o cayó en un tramo que ninguna caja cubre-- y
   * se trata igual: hay que mirarlo. Son distintos motivos para preguntar, misma acción.
   */
  private prepararSemaforo(): void {
    const confianzas = this.data.confianzas || {};
    this.campos.forEach((c) => {
      const leido = this.valorLeido(c);
      c.leido = leido == null ? null : String(leido);
      if (leido == null || leido === '') {
        // El OCR no lo trajo. No es dudoso: es un campo vacío como en la carga a mano de siempre.
        c.bueno = false;
        c.dudoso = false;
        return;
      }
      const conf = confianzas[c.claveOcr];
      c.bueno = typeof conf === 'number' && conf >= CONFIANZA_MINIMA;
      c.dudoso = !c.bueno;
      c.pista = c.bueno
        ? 'Leído con claridad'
        : typeof conf === 'number'
          ? 'Lectura poco clara — verificá contra el ticket'
          : 'No se pudo medir la lectura — verificá contra el ticket';
    });
  }

  /**
   * Cuántos dudosos quedan sin resolver.
   *
   * <b>Corregir cuenta como confirmar.</b> Si el cajero cambió el valor, ya miró el ticket: pedirle
   * además un tilde sería fricción sin información. El tilde existe para el caso contrario, el de
   * "lo miré y está bien".
   */
  private recalcular(): void {
    let faltan = 0;
    this.campos.forEach((c) => {
      if (!c.dudoso) return;
      const actual = this.formGroup.get(c.clave)?.value;
      const corregido = String(actual == null ? '' : actual) !== String(c.leido == null ? '' : c.leido);
      if (!corregido && !this.confirmado[c.clave]) faltan++;
    });
    this.faltaConfirmar = faltan;
  }

  /** El tilde de "coincide con el ticket" de un campo dudoso. */
  onConfirmarCampo(clave: string, valor: boolean): void {
    this.confirmado[clave] = valor;
    this.recalcular();
  }

  /** Lo que el OCR leyó para este campo, con la clave que usa el cupón. */
  private valorLeido(c: CampoManual): any {
    const v = this.data?.valores;
    if (!v || !c.claveOcr) return null;
    const leido = v[c.claveOcr];
    return leido == null || leido === '' ? null : leido;
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
    if (this.formGroup.invalid || this.guardando || this.faltaConfirmar > 0) return;
    const v = this.formGroup.value;

    // Sin un PENDIENTE al cual apuntar, el diálogo sólo devuelve lo tipeado: la venta todavía no
    // existe y el guardado lo hace el PDV junto con ella.
    if (this.data.ventaTarjetaId == null) {
      this.dialogRef.close({
        codigoAutorizacion: limpiar(v.codigoAutorizacion),
        numeroBoleta: limpiar(v.numeroBoleta),
        // El PDV lo lee como `monto` para compararlo con lo cobrado; la venta lo guarda como
        // `montoEscaneado`. Van los dos con el mismo valor para no obligar al llamador a saberlo.
        monto: aNumero(v.montoEscaneado),
        montoEscaneado: aNumero(v.montoEscaneado),
        identificadorTransaccion: limpiar(v.identificadorTransaccion),
        monedaId: this.data.monedaId,
        // Ata la foto a la venta. Sin esto la purga no puede distinguir la evidencia de un cobro
        // de una captura que quedó por el camino.
        capturaToken: this.data.capturaToken,
        origen: this.data.origen || 'MANUAL',
        datosExtra: this.data.datosExtra,
        manual: this.data.origen !== 'OCR',
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
        // `origen` ya se puede mandar: la columna y el campo del input viajan en esta misma
        // entrega. Un cupón confirmado desde el OCR queda como OCR y no como MANUAL — la columna
        // guarda el origen DOMINANTE, y de ahí salieron los datos; que el cajero haya corregido un
        // campo es justamente lo que el semáforo existe para provocar, no un cambio de procedencia.
        origen: this.data.origen || 'MANUAL',
        // La foto queda atada a la venta: es lo que impide que la purga se lleve la evidencia.
        capturaToken: this.data.capturaToken,
        // Los campos propios del proveedor. No se muestran, pero se guardan.
        datosExtra: this.data.datosExtra,
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
