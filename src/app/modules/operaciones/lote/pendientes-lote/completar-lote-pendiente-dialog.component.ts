import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { InfoPendienteLote, LoteEncontrado, PendienteLote } from '../lote.model';
import { LoteService } from '../lote.service';
import { esVencimientoDistinto, motivoNoConfirmar, restante } from './pendiente-lote.util';

export interface CompletarLotePendienteData {
  pendiente: PendienteLote;
}

/**
 * Completar una recepción que entró sin lote (#429 fase 2, entrega 3). Pasa unidades de SIN LOTE
 * al lote con un ajuste ATRIBUIR en el central: la existencia del producto no cambia. Nunca más
 * que el SIN LOTE disponible, que pudo bajar por ventas sin lote desde la recepción.
 */
@UntilDestroy()
@Component({
  selector: 'app-completar-lote-pendiente-dialog',
  templateUrl: './completar-lote-pendiente-dialog.component.html',
  styleUrls: ['./pendientes-lote.component.scss']
})
export class CompletarLotePendienteDialogComponent implements OnInit {
  info: InfoPendienteLote = null;
  numeroLote = '';
  fechaVencimiento = '';
  cantidad: number = null;
  cerrarRemanente = false;
  motivoRemanente = '';
  cargando = false;
  guardando = false;
  error: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CompletarLotePendienteData,
    private dialogRef: MatDialogRef<CompletarLotePendienteDialogComponent>,
    private loteService: LoteService,
    private dialogos: DialogosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar(true);
  }

  /** Recarga saldo, sincronización y lotes parecidos al número escrito. */
  cargar(sugerir = false): void {
    this.cargando = true;
    this.error = null;
    this.loteService.onInfoLotePendiente(this.data.pendiente.mslId, this.data.pendiente.sucursalId, this.numeroLote)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.info = res;
          if (sugerir || this.cantidad == null) this.cantidad = res?.cantidadSugerida ?? null;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.error = 'No se pudo cargar el pendiente. Puede que el central no tenga esta función todavía.';
          this.cdr.markForCheck();
        }
      });
  }

  elegirLote(l: LoteEncontrado): void {
    this.numeroLote = l.numeroLote;
    this.fechaVencimiento = l.fechaVencimiento ? String(l.fechaVencimiento).substring(0, 10) : '';
  }

  get bloqueo(): string | null {
    return motivoNoConfirmar(this.info, this.numeroLote, this.cantidad, this.cerrarRemanente, this.motivoRemanente);
  }

  get queda(): number {
    return this.info ? restante(this.info, this.cantidad) : 0;
  }

  confirmar(confirmarVencimiento = false): void {
    if (this.bloqueo || this.guardando) return;
    this.guardando = true;
    this.loteService.onCompletarLotePendiente({
      mslId: this.data.pendiente.mslId,
      sucursalId: this.data.pendiente.sucursalId,
      numeroLote: this.numeroLote.trim(),
      fechaVencimiento: this.fechaVencimiento || null,
      cantidad: this.cantidad,
      saldoSinLoteEsperado: this.info.saldoSinLote,
      cerrarRemanente: this.cerrarRemanente && this.queda > 0,
      motivoRemanente: this.cerrarRemanente ? this.motivoRemanente : null,
      confirmarVencimiento
    }).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.guardando = false;
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.guardando = false;
        if (!confirmarVencimiento && esVencimientoDistinto(err)) {
          this.dialogos.confirm('Lote con otro vencimiento',
            'Ese lote ya existe con otro vencimiento. ¿Usarlo con el vencimiento que ya tiene?')
            .pipe(untilDestroyed(this))
            .subscribe((ok) => { if (ok) this.confirmar(true); });
          return;
        }
        // El central ya avisó el motivo; si fue porque cambió el saldo, se recarga.
        this.cargar(true);
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
