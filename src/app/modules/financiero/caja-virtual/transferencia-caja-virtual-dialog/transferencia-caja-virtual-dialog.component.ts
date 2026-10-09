import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { nuevaClaveIdempotencia } from '../../../../commons/core/utils/claveIdempotencia';
import { MontoCajaVirtual, PedidoDeTransferencias } from '../pedido-en-lote';
import { CajaVirtual } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { esTimeoutDeLink, TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { MainService } from '../../../../main.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-transferencia-caja-virtual-dialog',
  templateUrl: './transferencia-caja-virtual-dialog.component.html',
  styleUrls: ['./transferencia-caja-virtual-dialog.component.scss']
})
export class TransferenciaCajaVirtualDialogComponent implements OnInit {

  formGroup: FormGroup;
  cantidadGsControl = new FormControl(null, [Validators.min(0.01)]);
  cantidadRsControl = new FormControl(null, [Validators.min(0.01)]);
  cantidadDsControl = new FormControl(null, [Validators.min(0.01)]);
  cajaDestinoControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl('');

  monedaGs: Moneda;
  monedaRs: Moneda;
  monedaDs: Moneda;

  currencyOptionsGs: any;
  currencyOptionsRs: any;
  currencyOptionsDs: any;

  cajasList: CajaVirtual[] = [];
  isSaving = false;

  /** El pedido que quedó sin respuesta. Mientras exista solo se puede reenviarlo o cerrar. */
  private pedidoPendiente: PedidoDeTransferencias | null = null;
  /** Espejos de `pedidoPendiente` para el template (campos, no getters). */
  hayPendiente = false;
  pendienteDescripcion = '';

  constructor(
    private dialogRef: MatDialogRef<TransferenciaCajaVirtualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cajaOrigen: CajaVirtual,
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
      cajaDestinoControl: this.cajaDestinoControl,
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

    const sinCajas = 'No se pudieron cargar las cajas de destino: cerrá y volvé a abrir para reintentar.';
    this.cajaVirtualService.onGetActivas(PROPAGAR_ERROR_DE_RED,
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (res == null) { this.notificacion.openWarn(sinCajas, 5); return; }
        this.cajasList = res.filter(c => c.id !== this.cajaOrigen?.id);
      },
      error: () => this.notificacion.openWarn(sinCajas, 5)
    });
  }

  onSave() {
    if (this.hayPendiente || this.isSaving) return;
    if (this.formGroup.invalid) return;

    const cajaDestino: CajaVirtual = this.cajaDestinoControl.value;

    const amtGs = this.cantidadGsControl.value;
    const amtRs = this.cantidadRsControl.value;
    const amtDs = this.cantidadDsControl.value;

    if (!amtGs && !amtRs && !amtDs) {
      this.notificacion.openAlgoSalioMal('Debe ingresar al menos un monto a transferir');
      return;
    }

    const montos: MontoCajaVirtual[] = [];
    const nombres: string[] = [];
    const agregar = (cantidad: number, moneda: Moneda) => {
      if (!(cantidad > 0) || !moneda) return;
      montos.push({ monedaId: moneda.id, cantidad });
      nombres.push(moneda.denominacion);
    };
    agregar(amtGs, this.monedaGs);
    agregar(amtRs, this.monedaRs);
    agregar(amtDs, this.monedaDs);

    if (montos.length === 0) return;

    // Un solo pedido con todas las monedas: el central transfiere todo o nada. Antes iba uno por moneda y un
    // rechazo de la segunda dejaba la primera transferida. Una clave por cada «Transferir»; el pedido se guarda
    // entero, con ella, para poder reenviarlo idéntico.
    this.pendienteDescripcion = `${nombres.join(', ')} a ${cajaDestino.nombre}`;
    this.enviar({
      origenId: this.cajaOrigen.id,
      destinoId: cajaDestino.id,
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

  private enviar(pedido: PedidoDeTransferencias, esReenvio: boolean) {
    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): quien abrió el diálogo no refrescaría la caja.
    this.dialogRef.disableClose = true;
    // Sin «Guardado con éxito» genérico: el aviso lo da este diálogo.
    this.cajaVirtualService.onRealizarTransferencias(pedido, { avisarExito: false }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res == null) { this.quedoSinConfirmar(pedido, true); return; }
        this.notificacion.openSucess('Transferencia realizada correctamente');
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
  private quedoSinConfirmar(pedido: PedidoDeTransferencias, avisar: boolean) {
    this.pedidoPendiente = pedido;
    this.hayPendiente = true;
    if (avisar) {
      this.notificacion.openWarn('No se pudo confirmar si la transferencia se realizó: podés reintentar sin riesgo de repetirlo.', 8);
    }
  }

  /** Cierra con el pedido sin confirmar. Cierra con `true` para que la caja se relea. */
  cerrarSinConfirmar() {
    if (this.isSaving) return;
    this.notificacion.openWarn('No se pudo confirmar si la transferencia se realizó: revisá los movimientos de la caja antes de cargarlo de nuevo.', 12);
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
