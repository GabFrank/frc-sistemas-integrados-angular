import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { Maletin } from '../maletin.model';
import { MaletinService, PedidoDeEgresoMaletin } from '../maletin.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { centralNoConoceLaClave, nuevaClaveIdempotencia } from '../../../../commons/core/utils/claveIdempotencia';

export interface MaletinTesoreriaDialogData {
  cajaVirtual: CajaVirtual;
  esEgreso: boolean;
}

interface ValorItem { total: number; moneda: Moneda; sel?: boolean; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-maletin-tesoreria-dialog',
  templateUrl: './maletin-tesoreria-dialog.component.html',
  styleUrls: ['./maletin-tesoreria-dialog.component.scss']
})
export class MaletinTesoreriaDialogComponent implements OnInit {

  esEgreso = false;
  titulo = '';

  maletinControl = new FormControl(null, Validators.required);
  monedaControl = new FormControl(null, Validators.required);
  montoControl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
  descripcionControl = new FormControl('');

  maletinList: Maletin[] = [];
  maletinFiltrados: Maletin[] = [];
  monedaList: Moneda[] = [];

  // El maletín se identifica por su descripción (código de barras): autocomplete con lector o tipeo.
  displayMaletin = (m: Maletin): string => (m && m.descripcion) ? m.descripcion : '';
  // Valor por moneda dentro del maletín (solo ingreso): del último cierre de la caja que lo usó.
  valorItems: ValorItem[] = [];
  cargandoValor = false;

  currencyOpts: any = this.buildCurrencyOptions(null);
  isSaving = false;

  /**
   * El egreso que se mandó y quedó sin respuesta, con su clave. Mientras exista solo se puede reenviarlo o
   * cerrar: uno nuevo saldría con otra clave y egresaría otra vez (franco-system-backend-servidor#376).
   */
  private pedidoPendiente: PedidoDeEgresoMaletin | null = null;
  /** Espejos de `pedidoPendiente` para el template (campos, no getters). */
  hayPendiente = false;
  pendienteDescripcion = '';
  /** El central no conoce la clave: no protege la repetición, así que no se ofrece «Reintentar». */
  private centralSinClave = false;

  constructor(
    private dialogRef: MatDialogRef<MaletinTesoreriaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MaletinTesoreriaDialogData,
    private maletinService: MaletinService,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.esEgreso = !!this.data?.esEgreso;
    this.titulo = this.esEgreso ? 'Egreso de Maletín' : 'Ingreso de Maletín';

    this.maletinService.onGetAll(0, 500).pipe(untilDestroyed(this)).subscribe(res => {
      const items = res?.getContent || res || [];
      this.maletinList = (items as Maletin[]).filter(m => m.activo !== false);
      this.maletinFiltrados = this.maletinList.slice(0, 50);
    });

    // Autocomplete de maletín por código (descripción). El usuario tipea/escanea; al seleccionar
    // una opción el control pasa a tener el objeto Maletin. Mientras tipea, el valor es un string.
    this.maletinControl.valueChanges.pipe(untilDestroyed(this)).subscribe(val => {
      if (typeof val === 'string') {
        const t = val.trim().toUpperCase();
        this.maletinFiltrados = t
          ? this.maletinList.filter(m => (m.descripcion || '').toUpperCase().includes(t)).slice(0, 50)
          : this.maletinList.slice(0, 50);
      } else {
        this.maletinFiltrados = [];
      }
    });
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.monedaList = res;
    });
  }

  onMaletinChange() {
    // El valor precargado solo aplica al ingreso (lo que quedó físicamente en el maletín).
    if (this.esEgreso) return;
    const maletin: Maletin = this.maletinControl.value;
    if (!maletin?.id) return;
    this.cargandoValor = true;
    this.valorItems = [];
    this.maletinService.onGetValor(maletin.id).pipe(untilDestroyed(this)).subscribe({
      next: (res: ValorItem[]) => {
        this.cargandoValor = false;
        if (res == null) { this.notificacion.openWarn('No se pudo calcular el valor del maletín.', 5); return; }
        // Todas las monedas con valor arrancan seleccionadas; el usuario destilda las que no quiere.
        this.valorItems = (res || []).map(v => ({ ...v, sel: (v.total || 0) > 0 }));
        this.recalcularSeleccion();
      },
      error: () => {
        this.cargandoValor = false;
        this.notificacion.openWarn('No se pudo calcular el valor del maletín: el servidor no responde.', 5);
      }
    });
  }

  cantSeleccionadas = 0;

  /** Alterna la inclusión de una moneda en el ingreso (solo si tiene valor). */
  toggleValor(item: ValorItem) {
    if ((item.total || 0) <= 0) return;
    item.sel = !item.sel;
    this.recalcularSeleccion();
  }

  private recalcularSeleccion() {
    this.cantSeleccionadas = this.valorItems.filter(v => v.sel && (v.total || 0) > 0).length;
  }

  onMonedaChange() {
    this.actualizarCurrencyOpts();
    // En ingreso, si la moneda elegida tiene valor en el maletín, precarga ese monto.
    if (!this.esEgreso) {
      const moneda: Moneda = this.monedaControl.value;
      const item = this.valorItems.find(v => v.moneda?.id === moneda?.id);
      if (item) this.montoControl.setValue(item.total);
    }
  }

  private actualizarCurrencyOpts() {
    this.currencyOpts = this.buildCurrencyOptions(this.monedaControl.value);
  }

  /** Formato PY: Gs sin decimales, resto 2; miles ".", decimal ","; sin negativos. */
  private buildCurrencyOptions(moneda: Moneda | null): any {
    const decimales = moneda?.decimales != null ? moneda.decimales : ((moneda?.denominacion || '').toUpperCase().includes('GUARANI') ? 0 : 2);
    return {
      allowNegative: false, allowZero: false, precision: decimales,
      thousands: '.', decimal: decimales > 0 ? ',' : '', align: 'right',
      prefix: moneda?.simbolo ? moneda.simbolo + ' ' : '', suffix: '', nullable: true, min: 0, max: null,
    };
  }

  onSave() {
    if (this.hayPendiente || this.isSaving) return;
    if (!this.maletinControl.value?.id) return this.err('Seleccione un maletín válido de la lista');
    const cajaId = this.data.cajaVirtual?.id;
    const maletinId = this.maletinControl.value?.id;
    const desc = this.descripcionControl.value;

    let obs;
    if (this.esEgreso) {
      // Egreso: moneda + monto manuales (no hay valor de cierre para despachar).
      if (this.monedaControl.invalid) return this.err('Seleccione la moneda');
      if (!this.montoControl.value || this.montoControl.value <= 0) return this.err('Ingrese un monto válido');
      const moneda: Moneda = this.monedaControl.value;
      this.pendienteDescripcion = `${moneda?.simbolo || ''} ${Number(this.montoControl.value).toLocaleString('es-PY')}`.trim();
      // Una clave por cada «Confirmar». El pedido se guarda entero, con ella, para poder reenviarlo idéntico.
      this.enviarEgreso({
        cajaVirtualId: cajaId, maletinId, monedaId: moneda?.id, monto: this.montoControl.value,
        descripcion: desc || null, claveIdempotencia: nuevaClaveIdempotencia(),
      }, false);
      return;
    } else {
      // Ingreso: se ingresan todas las monedas tildadas del cierre, en una sola operación.
      const monedaIds = this.valorItems.filter(v => v.sel && (v.total || 0) > 0).map(v => v.moneda.id);
      if (monedaIds.length === 0) return this.err('Seleccione al menos una moneda para ingresar');
      obs = this.maletinService.onIngresarCierre(cajaId, maletinId, monedaIds, desc, true, { avisarExito: false });
    }

    // Sin «Guardado con éxito» (el éxito lo avisa este diálogo); el error lo da onSaveCustom.
    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): quien abrió el diálogo no refrescaría la caja.
    this.dialogRef.disableClose = true;
    obs.pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        this.dialogRef.disableClose = false;
        if (res != null) {
          this.notificacion.openSucess('Ingreso de maletín registrado');
          this.dialogRef.close(res);
        } else {
          this.sinConfirmar(true);
        }
      },
      error: err => {
        this.isSaving = false;
        this.dialogRef.disableClose = false;
        // Rechazo: no se registró nada y el motivo ya lo mostró onSaveCustom.
        if (erroresDeRechazo(err)) return;
        // El corte del link ya avisó que pudo haberse aplicado.
        this.sinConfirmar(!esTimeoutDeLink(err));
      }
    });
  }

  /**
   * El ingreso o egreso pudo haberse registrado, y el central no impide ingresar dos veces el mismo cierre
   * (#390). Se cierra para que la caja se relea: ahí se ve si el movimiento está, antes de repetirlo.
   */
  private sinConfirmar(avisar: boolean) {
    if (avisar) {
      const operacion = this.esEgreso ? 'EGRESO' : 'INGRESO';
      // El central lo describe con el código del maletín, o con su id si no tiene.
      const codigo = this.maletinControl.value?.descripcion || `#${this.maletinControl.value?.id}`;
      this.notificacion.openWarn(
        `No se pudo confirmar si se registró: buscá «${operacion} MALETIN ${codigo}» en los movimientos de la caja antes de repetirlo.`, 10);
    }
    this.dialogRef.close(true);
  }

  /**
   * Reenvía el egreso que quedó sin respuesta, idéntico y con su misma clave: si el central ya lo había
   * registrado devuelve ese movimiento, y si no, lo registra ahora. Nunca dos.
   */
  reenviar() {
    if (!this.pedidoPendiente || this.isSaving) return;
    this.enviarEgreso(this.pedidoPendiente, true);
  }

  private enviarEgreso(pedido: PedidoDeEgresoMaletin, esReenvio: boolean) {
    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): quien abrió el diálogo no refrescaría la caja.
    this.dialogRef.disableClose = true;
    this.maletinService.onEgresar(pedido, {
      avisarExito: false, esReenvio, sinClave: () => this.centralSinClave = true,
    }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res == null) { this.egresoSinConfirmar(pedido, true); return; }
        this.dialogRef.disableClose = false;
        this.notificacion.openSucess('Egreso de maletín registrado');
        this.dialogRef.close(res);
      },
      error: err => {
        this.isSaving = false;
        if (erroresDeRechazo(err)) {
          if (esReenvio && centralNoConoceLaClave(err)) {
            // El central volvió a una versión que no conoce la clave: reenviar sin ella podría egresar dos veces.
            this.notificacion.openWarn('El servidor ya no reconoce este reintento. Cerrá y revisá los movimientos de la caja antes de repetirlo.', 10);
            return;
          }
          if (esReenvio) {
            // Rechazo al reintentar (el motivo ya se mostró). Si el primer envío había entrado, volver al
            // formulario dejaría cargarlo otra vez con otra clave: se cierra para que se revise.
            this.dialogRef.disableClose = false;
            this.sinConfirmar(true);
            return;
          }
          // No se registró nada (el motivo ya lo mostró onSaveCustom): vuelve al formulario para corregir.
          this.pedidoPendiente = null;
          this.hayPendiente = false;
          this.dialogRef.disableClose = false;
          return;
        }
        // El corte del link ya avisó que pudo haberse aplicado.
        this.egresoSinConfirmar(pedido, !esTimeoutDeLink(err) || esReenvio);
      }
    });
  }

  /**
   * El egreso pudo haberse registrado. El diálogo queda abierto solo para reenviarlo (seguro, por la clave) o
   * cerrar: no se vuelve al formulario. `disableClose` sigue en true: Esc y el clic afuera cerrarían sin que la
   * caja se relea. Contra un central que no conoce la clave no hay reintento seguro: se cierra, como antes.
   */
  private egresoSinConfirmar(pedido: PedidoDeEgresoMaletin, avisar: boolean) {
    if (this.centralSinClave) {
      this.dialogRef.disableClose = false;
      this.sinConfirmar(avisar);
      return;
    }
    this.pedidoPendiente = pedido;
    this.hayPendiente = true;
    if (avisar) {
      this.notificacion.openWarn('No se pudo confirmar si el egreso se registró: podés reintentar sin riesgo de registrarlo dos veces.', 8);
    }
  }

  /** Cierra con el egreso sin confirmar. Cierra con `true` para que la caja se relea. */
  cerrarSinConfirmar() {
    if (this.isSaving) return;
    this.sinConfirmar(true);
  }

  private err(msg: string) { this.notificacion.openAlgoSalioMal(msg); }

  onCancel() { this.dialogRef.close(null); }
}
