import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { Prestamo } from '../prestamo.model';
import { PedidoDePrestamo, PrestamoService } from '../prestamo.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { centralNoConoceLaClave, nuevaClaveIdempotencia } from '../../../../commons/core/utils/claveIdempotencia';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';


export interface PrestamoDialogData {
  funcionarioId: number;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-prestamo-dialog',
  templateUrl: './edit-prestamo-dialog.component.html',
  styleUrls: ['./edit-prestamo-dialog.component.scss']
})
export class EditPrestamoDialogComponent implements OnInit {

  formGroup: FormGroup;
  monedas: Moneda[] = [];
  cajas: CajaVirtual[] = [];

  isSaving = false;
  /**
   * El préstamo que se mandó y quedó sin respuesta, con su clave. Mientras exista solo se puede reenviarlo o
   * cerrar: uno nuevo saldría con otra clave y desembolsaría otra vez (franco-system-backend-servidor#376).
   */
  private pedidoPendiente: PedidoDePrestamo | null = null;
  /** Espejos de `pedidoPendiente` para el template (campos, no getters). */
  hayPendiente = false;
  pendienteDescripcion = '';
  /** El central no conoce la clave: no protege la repetición, así que no se ofrece «Reintentar». */
  private centralSinClave = false;

  funcionarioControl = new FormControl(null, [Validators.required]);
  descripcionControl = new FormControl(null);
  montoTotalControl = new FormControl(0, [Validators.required, Validators.min(1)]);
  monedaControl = new FormControl(null, [Validators.required]);
  fechaInicioControl = new FormControl(new Date(), [Validators.required]);
  cantidadCuotasControl = new FormControl(1, [Validators.required, Validators.min(1)]);
  cajaControl = new FormControl(null, [Validators.required]);
  observacionControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PrestamoDialogData,
    private dialogRef: MatDialogRef<EditPrestamoDialogComponent>,
    private prestamoService: PrestamoService,
    private monedaService: MonedaService,
    private cajaVirtualService: CajaVirtualService,
    private notificacion: NotificacionSnackbarService
  ) {
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      funcionario: this.funcionarioControl,
      descripcion: this.descripcionControl,
      montoTotal: this.montoTotalControl,
      moneda: this.monedaControl,
      fechaInicio: this.fechaInicioControl,
      cantidadCuotas: this.cantidadCuotasControl,
      caja: this.cajaControl,
      observacion: this.observacionControl
    });
    if (this.data?.funcionarioId != null) {
      this.funcionarioControl.setValue(this.data.funcionarioId);
    }
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe((res: Moneda[]) => {
      this.monedas = res || [];
      const guarani = this.monedas.find(m => m.denominacion && m.denominacion.toUpperCase().includes('GUARANI'));
      if (guarani) this.monedaControl.setValue(guarani.id);
    });
    this.cajaVirtualService.onGetActivas().pipe(untilDestroyed(this)).subscribe((res: CajaVirtual[]) => {
      this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR');
    });
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid || this.isSaving || this.hayPendiente) { return; }
    const p = new Prestamo();
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    p.funcionario = func;
    p.descripcion = this.descripcionControl.value ? this.descripcionControl.value.toUpperCase() : null;
    p.montoTotal = this.montoTotalControl.value;
    const mon = new Moneda();
    mon.id = this.monedaControl.value;
    p.moneda = mon;
    p.fechaInicio = dateToString(this.fechaInicioControl.value);
    p.cantidadCuotas = this.cantidadCuotasControl.value;
    p.observacion = this.observacionControl.value ? this.observacionControl.value.toUpperCase() : null;

    const moneda = this.monedas.find(m => m.id === mon.id);
    this.pendienteDescripcion = `${moneda?.simbolo || ''} ${Number(p.montoTotal).toLocaleString('es-PY')}`.trim();
    // Una clave por cada «Crear y desembolsar». El input se arma una sola vez y se guarda con ella.
    this.enviar({ prestamo: p.toInput(), cajaVirtualId: this.cajaControl.value, claveIdempotencia: nuevaClaveIdempotencia() }, false);
  }

  /**
   * Reenvía el préstamo que quedó sin respuesta, idéntico y con su misma clave: si el central ya lo había creado
   * devuelve ese préstamo, y si no, lo crea y desembolsa ahora. Nunca dos.
   */
  reenviar() {
    if (!this.pedidoPendiente || this.isSaving) return;
    this.enviar(this.pedidoPendiente, true);
  }

  private enviar(pedido: PedidoDePrestamo, esReenvio: boolean) {
    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): la lista de préstamos no se releería.
    this.dialogRef.disableClose = true;
    // El aviso de un rechazo o de un error de red ya lo muestra GenericCrudService.onSaveCustom.
    this.prestamoService.onCrear(pedido, { esReenvio, sinClave: () => this.centralSinClave = true })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res == null) { this.quedoSinConfirmar(pedido, true); return; }
          this.dialogRef.close(res);
        },
        error: err => {
          this.isSaving = false;
          if (erroresDeRechazo(err)) {
            if (esReenvio && centralNoConoceLaClave(err)) {
              // El central volvió a una versión que no conoce la clave: reenviar sin ella podría desembolsar dos veces.
              this.notificacion.openWarn('El servidor ya no reconoce este reintento. Cerrá y revisá los préstamos del funcionario antes de repetirlo.', 10);
              return;
            }
            if (esReenvio) {
              // Rechazo al reintentar (el motivo ya se mostró). Si el primer envío había entrado, volver al
              // formulario dejaría desembolsarlo otra vez con otra clave: se cierra para que se revise.
              this.cerrarConAviso();
              return;
            }
            // No se creó nada: vuelve al formulario para corregir. El diálogo se abre con disableClose y sigue así.
            this.pedidoPendiente = null;
            this.hayPendiente = false;
            return;
          }
          // El corte del link ya avisó que pudo haberse aplicado.
          this.quedoSinConfirmar(pedido, !esTimeoutDeLink(err) || esReenvio);
        }
      });
  }

  /**
   * El préstamo pudo haberse creado y desembolsado. El diálogo queda abierto solo para reenviarlo (seguro, por
   * la clave) o cerrar: no se vuelve al formulario. Contra un central que no conoce la clave no hay reintento
   * seguro: se cierra con el aviso de qué revisar.
   */
  private quedoSinConfirmar(pedido: PedidoDePrestamo, avisar: boolean) {
    if (this.centralSinClave) {
      this.cerrarConAviso();
      return;
    }
    this.pedidoPendiente = pedido;
    this.hayPendiente = true;
    if (avisar) {
      this.notificacion.openWarn('No se pudo confirmar si el préstamo se creó: podés reintentar sin riesgo de desembolsarlo dos veces.', 8);
    }
  }

  /** Cierra con el préstamo sin confirmar. Cierra con `true` para que la lista se relea. */
  cerrarSinConfirmar() {
    if (this.isSaving) return;
    this.cerrarConAviso();
  }

  private cerrarConAviso() {
    this.notificacion.openWarn(
      `No se pudo confirmar si el préstamo de ${this.pendienteDescripcion} se creó: revisá los préstamos del funcionario y los movimientos de la caja antes de repetirlo.`, 12);
    this.dialogRef.close(true);
  }
}
