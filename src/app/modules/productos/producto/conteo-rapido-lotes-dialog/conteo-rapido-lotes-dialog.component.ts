import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { LoteService } from '../../../operaciones/lote/lote.service';
import { AjusteStockLoteInput, ModoAjusteLote } from '../../../operaciones/lote/lote.model';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { avisoTrasMutacion } from '../../../../commons/core/utils/graphqlErrorUtils';
import { Producto } from '../producto.model';
import { construirConteoRapido, FilaConteo, TOPE_CONTEO_RAPIDO } from './conteo-rapido';

export interface ConteoRapidoLotesDialogData {
  producto: Producto;
}

/**
 * Conteo rápido de lotes (#429): se cuentan todos los lotes de un producto en una sucursal y se
 * guardan juntos, en una sola transacción. Solo viajan las filas con diferencia; cada una lleva el
 * saldo que vio el operador, así que si entró una venta mientras contaba el backend rechaza y se recarga.
 */
@UntilDestroy()
@Component({
  selector: 'app-conteo-rapido-lotes-dialog',
  templateUrl: './conteo-rapido-lotes-dialog.component.html',
  styleUrls: ['./conteo-rapido-lotes-dialog.component.scss']
})
export class ConteoRapidoLotesDialogComponent implements OnInit {
  sucursales: Sucursal[] = [];
  sucursalId: number = null;
  filas: FilaConteo[] = [];
  liberar = false;
  motivo = '';
  cargando = false;
  guardando = false;
  readonly tope = TOPE_CONTEO_RAPIDO;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConteoRapidoLotesDialogData,
    private dialogRef: MatDialogRef<ConteoRapidoLotesDialogComponent>,
    private sucursalService: SucursalService,
    private loteService: LoteService,
    private notificacionService: NotificacionSnackbarService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.sucursales = (res || []).filter((s) => s.nombre !== 'SERVIDOR');
          this.cdr.markForCheck();
        },
        error: () => this.notificacionService.openWarn('No se pudieron cargar las sucursales.', 5)
      });
  }

  onSucursal(id: number): void {
    this.sucursalId = id;
    this.cargar();
  }

  cargar(): void {
    if (this.sucursalId == null) {
      return;
    }
    this.cargando = true;
    this.filas = [];
    this.loteService.onGetStockPorLote(this.data.producto.id, this.sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: any[]) => {
          this.filas = (res || [])
            .filter((l) => l.loteId != null)
            .map((l) => ({
              loteId: +l.loteId,
              numeroLote: l.numeroLote,
              fechaVencimiento: l.fechaVencimiento,
              saldo: Number(l.cantidadDisponible) || 0,
              contado: null
            }));
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.notificacionService.openWarn('No se pudo leer el saldo de los lotes.', 5);
        }
      });
  }

  diferencia(f: FilaConteo): number | null {
    return f.contado == null || (f.contado as any) === '' ? null : Number(f.contado) - f.saldo;
  }

  get inputs(): AjusteStockLoteInput[] {
    return construirConteoRapido(this.filas, {
      productoId: this.data.producto.id,
      sucursalId: this.sucursalId,
      modo: this.liberar ? ModoAjusteLote.LIBERAR : ModoAjusteLote.CORREGIR,
      motivo: this.motivo,
      usuarioId: this.mainService.usuarioActual?.id
    });
  }

  get error(): string | null {
    const inputs = this.inputs;
    if (inputs.length === 0) {
      return 'Cargá al menos un lote con diferencia.';
    }
    if (inputs.length > this.tope) {
      return `Como máximo ${this.tope} lotes por vez.`;
    }
    if (this.liberar && inputs.some((i) => i.cantidadFinal > (i.saldoEsperado ?? 0))) {
      return 'Liberar solo baja saldo: un lote contado de más se corrige sin la casilla.';
    }
    if (this.liberar && !this.motivo?.trim()) {
      return 'Para liberar a «SIN LOTE» el motivo es obligatorio.';
    }
    return null;
  }

  onGuardar(): void {
    if (this.error != null || this.guardando) {
      return;
    }
    this.guardando = true;
    this.loteService.onAjustarStockLoteLista(this.inputs)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.guardando = false;
          if (res != null) {
            this.notificacionService.openSucess(`Conteo guardado: ${res.length} lote(s) ajustado(s)`);
            this.dialogRef.close(res);
          } else {
            this.cargar();
          }
        },
        error: (e) => {
          this.guardando = false;
          const aviso = avisoTrasMutacion(e, 'se guardó el conteo');
          if (aviso != null) {
            this.notificacionService.openWarn(aviso, 8);
          }
          this.cargar();
        }
      });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
