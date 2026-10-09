import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntradaVaria, EntradaVariaCategoria } from '../entrada-varia.model';
import { EntradaVariaService, PedidoDeEntradaVaria } from '../entrada-varia.service';
import { centralNoConoceLaClave, nuevaClaveIdempotencia } from '../../../../commons/core/utils/claveIdempotencia';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { FormaPago } from '../../forma-pago/forma-pago.model';
import { FormaPagoService } from '../../forma-pago/forma-pago.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { MainService } from '../../../../main.service';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';

export interface EntradaVariaDialogData {
  cajaVirtual: CajaVirtual;
  esIngreso: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-entrada-varia-dialog',
  templateUrl: './add-entrada-varia-dialog.component.html',
  styleUrls: ['./add-entrada-varia-dialog.component.scss']
})
export class AddEntradaVariaDialogComponent implements OnInit {

  formGroup: FormGroup;
  montoControl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
  monedaControl = new FormControl(null, Validators.required);
  categoriaControl = new FormControl(null);
  formaPagoControl = new FormControl(null);
  descripcionControl = new FormControl('', Validators.required);
  numeroComprobanteControl = new FormControl('');

  monedaList: Moneda[] = [];
  categoriaList: EntradaVariaCategoria[] = [];
  formaPagoList: FormaPago[] = [];

  currencyOptions: any;

  isSaving = false;

  /**
   * La entrada que se mandó y quedó sin respuesta: el input ya armado y su clave. Mientras exista solo se
   * puede reenviar o cerrar: un pedido nuevo saldría con otra clave y se registraría otra vez
   * (franco-system-backend-servidor#376).
   */
  private pedidoPendiente: PedidoDeEntradaVaria | null = null;
  private pendienteOriginal: EntradaVaria | null = null;
  /** Espejos de `pedidoPendiente` para el template (campos, no getters). */
  hayPendiente = false;
  pendienteDescripcion = '';
  /** El central no conoce la clave: no protege la repetición, así que no se ofrece «Reintentar». */
  private centralSinClave = false;
  titulo = 'Entrada Varia';

  constructor(
    private dialogRef: MatDialogRef<AddEntradaVariaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EntradaVariaDialogData,
    private entradaVariaService: EntradaVariaService,
    private monedaService: MonedaService,
    private formaPagoService: FormaPagoService,
    private notificacion: NotificacionSnackbarService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      montoControl: this.montoControl,
      monedaControl: this.monedaControl,
      categoriaControl: this.categoriaControl,
      formaPagoControl: this.formaPagoControl,
      descripcionControl: this.descripcionControl,
      numeroComprobanteControl: this.numeroComprobanteControl,
    });

    this.titulo = this.data?.esIngreso ? 'Ingreso Vario' : 'Egreso Vario';

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.monedaList = res;
        const gs = res.find(m => m.denominacion?.toUpperCase().includes('GUARANI'));
        this.monedaControl.setValue(gs ?? res[0]);
        this.onMonedaChange();
      }
    });

    const sinCategorias = 'No se pudieron cargar las categorías: cerrá y volvé a abrir para reintentar.';
    this.entradaVariaService.onGetCategorias().pipe(untilDestroyed(this)).subscribe({
      next: res => { if (res != null) { this.categoriaList = res; } else { this.notificacion.openWarn(sinCategorias, 5); } },
      error: () => this.notificacion.openWarn(sinCategorias, 5)
    });

    this.formaPagoService.formaPagoSub.pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.formaPagoList = res;
    });
  }

  onMonedaChange() {
    if (this.monedaControl.value) {
      this.currencyOptions = this.monedaService.currencyOptionsByMoneda(this.monedaControl.value);
    }
  }

  onSave() {
    if (this.formGroup.invalid || this.isSaving || this.hayPendiente) return;

    const entradaVaria = new EntradaVaria();
    entradaVaria.descripcion = this.descripcionControl.value;
    entradaVaria.monto = this.montoControl.value;
    entradaVaria.esIngreso = !!this.data?.esIngreso;
    entradaVaria.cajaVirtual = this.data?.cajaVirtual;
    entradaVaria.moneda = this.monedaControl.value;
    entradaVaria.categoria = this.categoriaControl.value;
    entradaVaria.formaPago = this.formaPagoControl.value;
    entradaVaria.numeroComprobante = this.numeroComprobanteControl.value;

    const que = entradaVaria.esIngreso ? 'ingreso' : 'egreso';
    this.pendienteDescripcion = `${que} de ${entradaVaria.moneda?.simbolo || ''} ${(entradaVaria.monto || 0).toLocaleString('es-PY')}`.trim();
    // Una clave por cada «Guardar». El input se arma una sola vez y se guarda con ella, para reenviarlo idéntico.
    this.enviar({ input: entradaVaria.toInput(), claveIdempotencia: nuevaClaveIdempotencia() }, entradaVaria, false);
  }

  /**
   * Reenvía la entrada que quedó sin respuesta, idéntica y con su misma clave: si el central ya la había
   * registrado devuelve esa entrada, y si no, la registra ahora. Nunca dos.
   */
  reenviar() {
    if (!this.pedidoPendiente || this.isSaving) return;
    this.enviar(this.pedidoPendiente, this.pendienteOriginal, true);
  }

  private enviar(pedido: PedidoDeEntradaVaria, original: EntradaVaria, esReenvio: boolean) {
    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): quien abrió el diálogo no releería nada.
    this.dialogRef.disableClose = true;
    // El aviso de éxito es propio (más específico); el de un rechazo lo da onSaveCustom.
    this.entradaVariaService.onRegistrar(pedido, { avisarExito: false, esReenvio, sinClave: () => this.centralSinClave = true })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res == null) { this.quedoSinConfirmar(pedido, original, true); return; }
          this.dialogRef.disableClose = false;
          this.notificacion.openSucess('Movimiento registrado correctamente');
          this.dialogRef.close(res);
        },
        error: err => {
          this.isSaving = false;
          if (erroresDeRechazo(err)) {
            if (esReenvio && centralNoConoceLaClave(err)) {
              // El central volvió a una versión que no conoce la clave: reenviar sin ella podría registrar dos.
              this.notificacion.openWarn('El servidor ya no reconoce este reintento. Cerrá y revisá antes de repetirlo.', 10);
              return;
            }
            // No se registró nada (el motivo ya lo mostró onSaveCustom): vuelve al formulario para corregir.
            this.pedidoPendiente = null;
            this.pendienteOriginal = null;
            this.hayPendiente = false;
            this.dialogRef.disableClose = false;
            return;
          }
          // El corte del link ya avisó que pudo haberse aplicado.
          this.quedoSinConfirmar(pedido, original, !esTimeoutDeLink(err) || esReenvio);
        }
      });
  }

  /**
   * La entrada pudo haberse registrado. El diálogo queda abierto solo para reenviarla (seguro, por la clave) o
   * cerrar: no se vuelve al formulario, porque un pedido nuevo saldría con otra clave. `disableClose` sigue en
   * true: Esc y el clic afuera cerrarían sin que quien abrió el diálogo relea. Contra un central que no conoce
   * la clave no hay reintento seguro: se cierra, como antes.
   */
  private quedoSinConfirmar(pedido: PedidoDeEntradaVaria, original: EntradaVaria, avisar: boolean) {
    if (this.centralSinClave) {
      this.dialogRef.disableClose = false;
      this.sinConfirmar(original, avisar);
      return;
    }
    this.pedidoPendiente = pedido;
    this.pendienteOriginal = original;
    this.hayPendiente = true;
    if (avisar) {
      this.notificacion.openWarn('No se pudo confirmar si se registró: podés reintentar sin riesgo de registrarla dos veces.', 8);
    }
  }

  /** Cierra sin confirmar, con el aviso de qué revisar. Cierra con `true` para que quien abrió relea. */
  cerrarSinConfirmar() {
    if (this.isSaving || !this.pendienteOriginal) return;
    this.sinConfirmar(this.pendienteOriginal, true);
  }

  /**
   * El movimiento pudo haberse registrado, y el central registra otro igual si se repite (#390). Se cierra para
   * que la caja se relea: ahí se ve si está, antes de cargarlo de nuevo.
   */
  private sinConfirmar(entradaVaria: EntradaVaria, avisar: boolean) {
    if (avisar) {
      const que = entradaVaria.esIngreso ? 'ingreso' : 'egreso';
      const monto = `${entradaVaria.moneda?.simbolo || ''} ${(entradaVaria.monto || 0).toLocaleString('es-PY')}`.trim();
      this.notificacion.openWarn(
        `No se pudo confirmar si el ${que} de ${monto} se registró: revisá los movimientos de la caja (y sus filtros) antes de repetirlo.`, 10);
    }
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
