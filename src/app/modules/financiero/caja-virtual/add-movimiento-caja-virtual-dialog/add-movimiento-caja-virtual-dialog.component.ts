import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { nuevaClaveIdempotencia } from '../../../../commons/core/utils/claveIdempotencia';
import { MontoCajaVirtual, PedidoDeMovimientos } from '../pedido-en-lote';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { CajaVirtual, CajaVirtualTipoMovimiento } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { MainService } from '../../../../main.service';

export interface MovimientoDialogData {
  cajaVirtual: CajaVirtual;
  tipoMovimiento: CajaVirtualTipoMovimiento;
  // Para AJUSTE: si es un ajuste "de egreso", el monto se envía negativo (el backend
  // respeta el signo del AJUSTE). Ingreso vs egreso del selector define la dirección.
  esEgreso?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-movimiento-caja-virtual-dialog',
  templateUrl: './add-movimiento-caja-virtual-dialog.component.html',
  styleUrls: ['./add-movimiento-caja-virtual-dialog.component.scss']
})
export class AddMovimientoCajaVirtualDialogComponent implements OnInit {

  formGroup: FormGroup;
  cantidadGsControl = new FormControl(null, [Validators.min(0.01)]);
  cantidadRsControl = new FormControl(null, [Validators.min(0.01)]);
  cantidadDsControl = new FormControl(null, [Validators.min(0.01)]);
  descripcionControl = new FormControl('', Validators.required);

  monedaGs: Moneda;
  monedaRs: Moneda;
  monedaDs: Moneda;

  currencyOptionsGs: any;
  currencyOptionsRs: any;
  currencyOptionsDs: any;

  isSaving = false;
  titulo: string = 'Movimiento';

  /** El pedido que quedó sin respuesta. Mientras exista solo se puede reenviarlo o cerrar. */
  private pedidoPendiente: PedidoDeMovimientos | null = null;
  /** Espejos de `pedidoPendiente` para el template (campos, no getters). */
  hayPendiente = false;
  pendienteDescripcion = '';

  tipoLabels = {
    [CajaVirtualTipoMovimiento.INGRESO]: 'Ingreso de Efectivo',
    [CajaVirtualTipoMovimiento.EGRESO]: 'Egreso de Efectivo',
    [CajaVirtualTipoMovimiento.AJUSTE]: 'Ajuste de Saldo',
  };

  constructor(
    private dialogRef: MatDialogRef<AddMovimientoCajaVirtualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovimientoDialogData,
    private cajaVirtualService: CajaVirtualService,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      cantidadGsControl: this.cantidadGsControl,
      cantidadRsControl: this.cantidadRsControl,
      cantidadDsControl: this.cantidadDsControl,
      descripcionControl: this.descripcionControl,
    });

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.monedaGs = res.find(m => m.denominacion?.toUpperCase().includes('GUARANI'));
        this.monedaRs = res.find(m => m.denominacion?.toUpperCase().includes('REAL'));
        this.monedaDs = res.find(m => m.denominacion?.toUpperCase().includes('DOLAR'));

        if (this.monedaGs) this.currencyOptionsGs = this.monedaService.currencyOptionsByMoneda(this.monedaGs);
        if (this.monedaRs) this.currencyOptionsRs = this.monedaService.currencyOptionsByMoneda(this.monedaRs);
        if (this.monedaDs) this.currencyOptionsDs = this.monedaService.currencyOptionsByMoneda(this.monedaDs);
      }
    });

    this.titulo = this.tipoLabels[this.data?.tipoMovimiento] || 'Movimiento';
  }

  onSave() {
    if (this.hayPendiente || this.isSaving) return;
    if (this.formGroup.invalid) return;

    const amtGs = this.cantidadGsControl.value;
    const amtRs = this.cantidadRsControl.value;
    const amtDs = this.cantidadDsControl.value;

    if (!amtGs && !amtRs && !amtDs) {
      this.notificacion.openAlgoSalioMal('Debe ingresar al menos un monto en alguna moneda');
      return;
    }

    // Verificar límite de Caja Chica si es un ingreso
    if (this.data.tipoMovimiento === CajaVirtualTipoMovimiento.INGRESO && 
        this.data.cajaVirtual.tipo === 'CAJA_CHICA') {
      
      const nuevoSaldoGs = (this.data.cajaVirtual.saldoGs || 0) + (amtGs || 0);
      const limite = this.data.cajaVirtual.limiteGs || 0;

      if (limite > 0 && nuevoSaldoGs > limite) {
        this.notificacion.openWarn(`¡Atención! La caja ha superado el límite de ${limite.toLocaleString('es-PY')} Gs.`, 6);
      }
    }

    // AJUSTE respeta el signo: un ajuste de egreso resta (monto negativo).
    const esAjusteEgreso = this.data.tipoMovimiento === CajaVirtualTipoMovimiento.AJUSTE && this.data.esEgreso;
    const montos: MontoCajaVirtual[] = [];
    const nombres: string[] = [];
    const agregar = (cantidad: number, moneda: Moneda) => {
      if (!(cantidad > 0) || !moneda) return;
      montos.push({ monedaId: moneda.id, cantidad: esAjusteEgreso ? -Math.abs(cantidad) : cantidad });
      nombres.push(moneda.denominacion);
    };
    agregar(amtGs, this.monedaGs);
    agregar(amtRs, this.monedaRs);
    agregar(amtDs, this.monedaDs);

    if (montos.length === 0) return;

    // Un solo pedido con todas las monedas: el central lo registra entero o no lo registra. Antes iba uno por
    // moneda y un rechazo de la segunda dejaba la primera adentro. Una clave por cada «Confirmar»; el pedido se
    // guarda entero, con ella, para poder reenviarlo idéntico.
    this.pendienteDescripcion = nombres.join(', ');
    this.enviar({
      cajaVirtualId: this.data.cajaVirtual.id,
      tipoMovimiento: this.data.tipoMovimiento,
      montos,
      descripcion: this.descripcionControl.value?.toUpperCase() || null,
      claveIdempotencia: nuevaClaveIdempotencia(),
    }, false);
  }

  /**
   * Reenvía el pedido que quedó sin respuesta, idéntico y con su misma clave: si el central ya lo había
   * registrado no lo repite, y si no, lo registra ahora (franco-system-backend-servidor#376).
   */
  reenviar() {
    if (!this.pedidoPendiente || this.isSaving) return;
    this.enviar(this.pedidoPendiente, true);
  }

  private enviar(pedido: PedidoDeMovimientos, esReenvio: boolean) {
    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): quien abrió el diálogo no refrescaría la caja.
    this.dialogRef.disableClose = true;
    // Sin «Guardado con éxito» genérico: el aviso lo da este diálogo.
    this.cajaVirtualService.onRegistrarMovimientos(pedido, { avisarExito: false }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res == null) { this.quedoSinConfirmar(pedido, true); return; }
        this.notificacion.openSucess('Movimientos registrados correctamente');
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving = false;
        if (erroresDeRechazo(err)) {
          // El central dijo que no, y como es todo o nada no quedó ninguna moneda adentro (el motivo ya lo
          // mostró onSaveCustom). Queda el formulario para corregir; el próximo intento sale con otra clave.
          this.pedidoPendiente = null;
          this.hayPendiente = false;
          this.dialogRef.disableClose = false;
          return;
        }
        // El corte del link ya avisó que pudo haberse aplicado.
        this.quedoSinConfirmar(pedido, !esTimeoutDeLink(err) || esReenvio);
      },
    });
  }

  /**
   * El pedido pudo haberse registrado. El diálogo queda abierto solo para reenviarlo (seguro, por la clave) o
   * cerrar: no se vuelve al formulario, porque un pedido nuevo saldría con otra clave y se sumaría a este.
   * `disableClose` sigue en true: Esc y el clic afuera cerrarían sin que la caja se relea.
   */
  private quedoSinConfirmar(pedido: PedidoDeMovimientos, avisar: boolean) {
    this.pedidoPendiente = pedido;
    this.hayPendiente = true;
    if (avisar) {
      this.notificacion.openWarn('No se pudo confirmar si el movimiento se registró: podés reintentar sin riesgo de repetirlo.', 8);
    }
  }

  /** Cierra con el pedido sin confirmar. Cierra con `true` para que la caja se relea. */
  cerrarSinConfirmar() {
    if (this.isSaving) return;
    this.notificacion.openWarn('No se pudo confirmar si el movimiento se registró: revisá los movimientos de la caja antes de cargarlo de nuevo.', 12);
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
