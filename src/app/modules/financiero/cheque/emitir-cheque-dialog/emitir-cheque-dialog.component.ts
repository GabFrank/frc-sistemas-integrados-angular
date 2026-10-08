import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Chequera, EstadoChequera } from '../../chequera/chequera.model';
import { ChequeraService } from '../../chequera/chequera.service';
import { ChequeService } from '../cheque.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { nuevaClaveIdempotencia } from '../../../../commons/core/utils/claveIdempotencia';

/** Una emisión tal como se envió, con su clave de idempotencia, y cómo nombrarla en un aviso. */
interface PedidoDeCheque {
  variables: {
    chequeraId: number; total: number; diferido: boolean;
    monedaId?: number; cuentaBancariaId?: number; fechaPago?: string; concepto?: string;
    claveIdempotencia: string;
  };
  descripcion: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-emitir-cheque-dialog',
  templateUrl: './emitir-cheque-dialog.component.html',
  styleUrls: ['./emitir-cheque-dialog.component.scss'],
})
export class EmitirChequeDialogComponent implements OnInit {

  formGroup: FormGroup;
  chequeraControl = new FormControl(null, Validators.required);
  totalControl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
  diferidoControl = new FormControl(false);
  fechaPagoControl = new FormControl(null);
  conceptoControl = new FormControl('');

  chequeras: Chequera[] = [];
  chequeraSel: Chequera | null = null;   // para mostrar cuenta/moneda/hojas
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
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      chequeraControl: this.chequeraControl,
      totalControl: this.totalControl,
      diferidoControl: this.diferidoControl,
      fechaPagoControl: this.fechaPagoControl,
      conceptoControl: this.conceptoControl,
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
    const cuenta = ch?.cuentaBancaria;
    const total = this.totalControl.value;
    // Una clave por cada «Emitir». El pedido se guarda entero, con ella, para poder reenviarlo idéntico.
    const pedido: PedidoDeCheque = {
      variables: {
        chequeraId: ch.id,
        total,
        diferido,
        monedaId: cuenta?.moneda?.id,
        cuentaBancariaId: cuenta?.id,
        fechaPago: diferido ? dateToString(this.fechaPagoControl.value, 'yyyy-MM-dd') : null,
        concepto: this.conceptoControl.value ? String(this.conceptoControl.value).toUpperCase() : null,
        claveIdempotencia: nuevaClaveIdempotencia(),
      },
      descripcion: this.describir(ch, total),
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
    this.chequeService.onEmitirManual(pedido.variables).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res != null) {
          this.notificacion.openSucess(pedido.variables.diferido ? 'Cheque diferido emitido' : 'Cheque emitido y cobrado');
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
    const numero = ch?.siguienteNumero != null ? `Nº ${ch.siguienteNumero} ` : '';
    const monto = `${ch?.cuentaBancaria?.moneda?.simbolo || ''} ${(total || 0).toLocaleString('es-PY')}`.trim();
    const chequera = ch?.nombre || ('chequera #' + ch?.id);
    return `${numero}(${chequera}, ${monto})`;
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
