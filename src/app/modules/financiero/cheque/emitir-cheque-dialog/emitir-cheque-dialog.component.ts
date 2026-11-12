import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { FechaPyDateAdapter } from '../../../../shared/utils/fecha-py-date-adapter';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Chequera, EstadoChequera } from '../../chequera/chequera.model';
import { ChequeraService } from '../../chequera/chequera.service';
import { ChequeService } from '../cheque.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { nuevaClaveIdempotencia } from '../../../../commons/core/utils/claveIdempotencia';
import { PedidoEmisionCheques } from '../cheque.model';
import { armarCuotas, CUOTAS_OPCIONES, INTERVALOS_DIAS, redondearMonto } from '../cheque-cuotas';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { NumeracionChequeraService } from '../../chequera/numeracion-chequera.service';

/** Una emisión tal como se envió, con su clave de idempotencia, y cómo nombrarla en un aviso. */
interface PedidoDeCheque {
  variables: PedidoEmisionCheques;
  descripcion: string;
}

/** Un cheque de la vista previa: número proyectado, fecha de pago y monto editables. */
interface ChequePrevio {
  numero: number | null;
  fechaPago: Date;
  monto: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-emitir-cheque-dialog',
  templateUrl: './emitir-cheque-dialog.component.html',
  styleUrls: ['./emitir-cheque-dialog.component.scss'],
  // dd/mm/aaaa tipeado: el NativeDateAdapter lo leería como mes/día.
  providers: [{ provide: DateAdapter, useClass: FechaPyDateAdapter }],
})
export class EmitirChequeDialogComponent implements OnInit {

  formGroup: FormGroup;
  chequeraControl = new FormControl(null, Validators.required);
  totalControl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
  diferidoControl = new FormControl(false);
  fechaPagoControl = new FormControl(null);
  conceptoControl = new FormControl('');
  beneficiarioControl = new FormControl('');
  nominalControl = new FormControl(true);
  fechaEmisionControl = new FormControl(new Date());
  cuotasControl = new FormControl(1);
  intervaloControl = new FormControl(30);

  cuotasOpciones = CUOTAS_OPCIONES;
  intervalos = INTERVALOS_DIAS;
  proveedor: Proveedor | null = null;
  /** Vista previa editable de los cheques que se van a emitir. */
  previa: ChequePrevio[] = [];
  /** Suma de la vista previa y su diferencia con el monto total (debe ser 0 para emitir). */
  sumaPrevia = 0;
  diferenciaPrevia = 0;
  /** Faltan hojas para los cheques de la vista previa. */
  faltanHojas = false;

  chequeras: Chequera[] = [];
  chequeraSel: Chequera | null = null;   // para mostrar cuenta/moneda/hojas
  /** Primer número libre según el central (saltea los inutilizados); mientras no responde, el de la chequera. */
  proximoNumero: number | null = null;
  isSaving = false;
  /** La emisión que quedó sin respuesta. Mientras exista solo se puede reenviarla o cerrar. */
  private pedidoPendiente: PedidoDeCheque | null = null;
  /** Espejos de `pedidoPendiente` para el template (campos, no getters). */
  hayPendiente = false;
  pendienteDescripcion = '';

  constructor(
    private dialogRef: MatDialogRef<EmitirChequeDialogComponent>,
    private chequeraService: ChequeraService,
    private chequeService: ChequeService,
    private notificacion: NotificacionSnackbarService,
    private proveedorService: ProveedorService,
    private numeracion: NumeracionChequeraService,
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      chequeraControl: this.chequeraControl,
      totalControl: this.totalControl,
      diferidoControl: this.diferidoControl,
      fechaPagoControl: this.fechaPagoControl,
      conceptoControl: this.conceptoControl,
      beneficiarioControl: this.beneficiarioControl,
      nominalControl: this.nominalControl,
      fechaEmisionControl: this.fechaEmisionControl,
      cuotasControl: this.cuotasControl,
      intervaloControl: this.intervaloControl,
    });

    const sinChequeras = () => this.notificacion.openWarn('No se pudieron cargar las chequeras: cerrá y volvé a abrir para reintentar.', 6);
    this.chequeraService.onLeerChequeras(0, 200).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (res == null) { sinChequeras(); return; }
        // Solo chequeras activas con hojas disponibles.
        this.chequeras = res.filter(
          c => c.estado === EstadoChequera.ACTIVA && (c.hojasDisponibles == null || c.hojasDisponibles > 0));
      },
      error: sinChequeras,
    });
  }

  onChequeraChange(ch: Chequera) {
    this.chequeraSel = ch;
    this.proximoNumero = ch?.siguienteNumero != null ? Number(ch.siguienteNumero) : null;
    this.armarPrevia();
    // Sin monto no hay vista previa, pero el encabezado igual muestra el próximo libre real.
    if (ch && !this.previa.length) {
      this.numeracion.onGetProximos(ch.id, 1).pipe(untilDestroyed(this)).subscribe(nums => {
        if (this.chequeraSel === ch && nums?.[0] != null) this.proximoNumero = nums[0];
      });
    }
  }

  /** Busca el proveedor; su nombre queda como beneficiario (editable). */
  buscarProveedor() {
    this.proveedorService.onSearchProveedorPorTexto(null).pipe(untilDestroyed(this)).subscribe(p => {
      if (!p) return;
      this.proveedor = p;
      this.beneficiarioControl.setValue(p.persona?.nombre || '');
    });
  }

  quitarProveedor() {
    this.proveedor = null;
  }

  /**
   * Arma la vista previa con la regla común de cuotas (la misma del pago). Se llama desde los cambios del formulario
   * que la afectan, no desde el HTML. Recalcular descarta lo editado a mano en la vista previa.
   */
  armarPrevia() {
    const total = Number(this.totalControl.value) || 0;
    const diferido = !!this.diferidoControl.value;
    const primera: Date = diferido && this.fechaPagoControl.value ? new Date(this.fechaPagoControl.value)
      : new Date(this.fechaEmisionControl.value || new Date());
    if (!this.chequeraSel || total <= 0) { this.previa = []; this.recalcularPrevia(); return; }
    const cuotas = diferido ? Number(this.cuotasControl.value) || 1 : 1;
    const plan = armarCuotas(total, cuotas, primera, Number(this.intervaloControl.value) || 30, this.decimales());
    const sig = this.chequeraSel.siguienteNumero != null ? Number(this.chequeraSel.siguienteNumero) : null;
    this.proximoNumero = sig;
    this.previa = plan.map(c => ({ numero: sig != null ? sig + c.indice : null, fechaPago: c.fechaPago, monto: c.monto }));
    this.recalcularPrevia();
    // Los números reales los decide el central, que saltea los inutilizados (central #603). Sin respuesta queda la
    // proyección de arriba, que es solo informativa.
    const previa = this.previa;
    this.numeracion.onGetProximos(this.chequeraSel.id, previa.length).pipe(untilDestroyed(this)).subscribe(nums => {
      if (!nums || previa !== this.previa) return;
      previa.forEach((c, i) => c.numero = nums[i] ?? null);
      if (nums[0] != null) this.proximoNumero = nums[0];
    });
  }

  /** Edición puntual de un cheque de la vista previa: se controla que la suma siga dando el total. */
  onMontoPrevioChange(c: ChequePrevio, valor: number) {
    c.monto = redondearMonto(Number(valor) || 0, this.decimales());
    this.recalcularPrevia();
  }

  onFechaPreviaChange(c: ChequePrevio, valor: Date) {
    if (valor) c.fechaPago = new Date(valor);
  }

  private recalcularPrevia() {
    const total = Number(this.totalControl.value) || 0;
    this.sumaPrevia = redondearMonto(this.previa.reduce((a, c) => a + (c.monto || 0), 0), this.decimales());
    this.diferenciaPrevia = redondearMonto(total - this.sumaPrevia, this.decimales());
    const hojas = this.chequeraSel?.hojasDisponibles;
    this.faltanHojas = hojas != null && this.previa.length > hojas;
  }

  private decimales(): number {
    const dec = this.chequeraSel?.cuentaBancaria?.moneda?.decimales;
    if (dec != null) return dec;
    return (this.chequeraSel?.cuentaBancaria?.moneda?.denominacion || '').toUpperCase().includes('GUARAN') ? 0 : 2;
  }

  onSave() {
    if (this.hayPendiente || this.isSaving) return;
    if (this.formGroup.invalid) {
      this.notificacion.openAlgoSalioMal('Complete chequera y monto');
      return;
    }
    const ch = this.chequeraControl.value as Chequera;
    const diferido = !!this.diferidoControl.value;
    if (diferido && !this.fechaPagoControl.value) {
      this.notificacion.openAlgoSalioMal('Un cheque diferido requiere fecha de pago');
      return;
    }
    if (!this.previa.length) this.armarPrevia();
    if (Math.abs(this.diferenciaPrevia) > 0.005) {
      this.notificacion.openAlgoSalioMal('Los cheques suman distinto del monto total: corregí los montos de la vista previa');
      return;
    }
    if (this.faltanHojas) {
      this.notificacion.openAlgoSalioMal('La chequera no tiene hojas para todos los cheques');
      return;
    }
    const beneficiario = this.beneficiarioControl.value ? String(this.beneficiarioControl.value).trim().toUpperCase() : null;
    // Una clave por cada «Emitir», para todo el lote. El pedido se guarda entero, con ella, para reenviarlo idéntico.
    const pedido: PedidoDeCheque = {
      variables: {
        chequeraId: ch.id,
        cheques: this.previa.map(c => ({
          total: c.monto,
          fechaPago: diferido ? dateToString(c.fechaPago, 'yyyy-MM-dd') : null,
        })),
        diferido,
        nominal: !!this.nominalControl.value,
        beneficiario,
        proveedorId: this.proveedor?.id || null,
        fechaEmision: dateToString(this.fechaEmisionControl.value || new Date(), 'yyyy-MM-dd HH:mm:ss'),
        concepto: this.conceptoControl.value ? String(this.conceptoControl.value).toUpperCase() : null,
        claveIdempotencia: nuevaClaveIdempotencia(),
      },
      descripcion: this.describir(ch, Number(this.totalControl.value) || 0),
    };
    this.enviar(pedido, false);
  }

  /**
   * Reenvía el cheque que quedó sin respuesta, idéntico y con su misma clave: si el central ya lo había emitido
   * devuelve ese cheque, y si no, lo emite ahora. Nunca dos (franco-system-backend-servidor#376).
   */
  reenviar() {
    if (!this.pedidoPendiente || this.isSaving) return;
    this.enviar(this.pedidoPendiente, true);
  }

  private enviar(pedido: PedidoDeCheque, esReenvio: boolean) {
    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): el dashboard no se releería.
    this.dialogRef.disableClose = true;
    this.chequeService.onEmitirCheques(pedido.variables).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res != null && res.length) {
          const n = res.length;
          const estado = res[0]?.estado;
          const que = pedido.variables.diferido ? 'diferido' : (estado === 'EMITIDO' ? 'emitido (pendiente de cobro)' : 'emitido y cobrado');
          this.notificacion.openSucess(n > 1 ? `${n} cheques emitidos` : `Cheque ${que}`);
          const aviso = res.find(c => c.avisoFondos)?.avisoFondos;
          if (aviso) this.notificacion.openWarn(aviso, 8);
          this.dialogRef.close(true);
        } else {
          this.quedoSinConfirmar(pedido, true);
        }
      },
      error: err => {
        this.isSaving = false;
        const rechazo = erroresDeRechazo(err);
        if (rechazo) {
          // El servidor dijo que no. En un reenvío significa que el pedido original no había entrado (el central
          // busca la clave antes de validar), salvo que el mensaje diga que el cheque se emitió y después se
          // anuló. En los dos casos queda el formulario para corregir y emitir de nuevo, con otra clave.
          this.notificacion.openAlgoSalioMal(rechazo[0]?.message || err?.message || 'No se pudo emitir el cheque');
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
   * El cheque pudo haberse emitido. El diálogo queda abierto con el pedido pendiente: solo se puede reenviarlo
   * (seguro, por la clave) o cerrar. No se vuelve al formulario, porque un «Emitir» nuevo saldría con otra clave
   * y emitiría otro cheque además de este. `disableClose` sigue en true: Esc y el clic afuera cerrarían sin que
   * el dashboard se relea.
   */
  private quedoSinConfirmar(pedido: PedidoDeCheque, avisar: boolean) {
    this.pedidoPendiente = pedido;
    this.pendienteDescripcion = pedido.descripcion;
    this.hayPendiente = true;
    if (avisar) {
      this.notificacion.openWarn('No se pudo confirmar si se emitió el cheque: podés reenviarlo sin riesgo de emitirlo dos veces.', 8);
    }
  }

  /**
   * Cierra con un cheque sin confirmar. El aviso no manda al dashboard de cheques porque ahí puede no verse (un
   * cheque al día no figura; uno diferido, solo si su fecha cae en el rango filtrado): lo que sí cambia siempre
   * es el próximo número de la chequera. Cierra con `true` para que el dashboard se relea.
   */
  cerrarSinConfirmar() {
    if (this.isSaving) return;
    const donde = this.pedidoPendiente?.variables.diferido
      ? 'fijate en Chequeras si el próximo número avanzó'
      : 'fijate en Chequeras si el próximo número avanzó y en los movimientos de la cuenta';
    this.notificacion.openWarn(
      `No se pudo confirmar si se emitió el cheque${this.pendienteDescripcion ? ' ' + this.pendienteDescripcion : ''}: ${donde} antes de emitirlo de nuevo.`, 12);
    this.dialogRef.close(true);
  }

  /** «Nº 123 (chequera X, Gs. 500.000)», con los datos del momento de emitir. */
  private describir(ch: Chequera, total: number): string {
    // Los números de la vista previa (los libres del central): con inutilizados en el medio no son consecutivos.
    const nums = this.previa.map(c => c.numero).filter(n => n != null);
    const numero = !nums.length ? '' : (nums.length > 1 ? `Nº ${nums[0]} a ${nums[nums.length - 1]} ` : `Nº ${nums[0]} `);
    const monto = `${ch?.cuentaBancaria?.moneda?.simbolo || ''} ${(total || 0).toLocaleString('es-PY')}`.trim();
    const chequera = ch?.nombre || ('chequera #' + ch?.id);
    return `${numero}(${chequera}, ${monto})`;
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
