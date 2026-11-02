import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { LoteService } from '../../../operaciones/lote/lote.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { avisoTrasMutacion } from '../../../../commons/core/utils/graphqlErrorUtils';
import { Producto } from '../producto.model';
import { construirReasignar, errorReasignar, FormReasignar, LoteConSaldo } from './reasignar-lote';

export interface ReasignarLoteDialogData {
  producto: Producto;
}

/**
 * «Pasar a otro lote» (lotes fase 3, entrega 2): mueve unidades de un lote a otro del mismo
 * producto en una sucursal, sin cambiar el stock. Es la corrección de una venta, transferencia o
 * recepción que se registró con el lote equivocado.
 */
@UntilDestroy()
@Component({
  selector: 'app-reasignar-lote-dialog',
  templateUrl: './reasignar-lote-dialog.component.html',
  styleUrls: ['../conteo-rapido-lotes-dialog/conteo-rapido-lotes-dialog.component.scss']
})
export class ReasignarLoteDialogComponent implements OnInit {
  sucursales: Sucursal[] = [];
  sucursalId: number = null;
  origenes: LoteConSaldo[] = [];
  destinos: { id: number; numeroLote: string }[] = [];
  form: FormReasignar = { origen: null, destinoId: null, cantidad: null, motivo: '' };
  referencia = '';
  forzar = false;
  cargando = false;
  guardando = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReasignarLoteDialogData,
    private dialogRef: MatDialogRef<ReasignarLoteDialogComponent>,
    private sucursalService: SucursalService,
    private loteService: LoteService,
    private notificacionService: NotificacionSnackbarService,
    public mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {}

  get esAdmin(): boolean {
    return this.mainService.usuarioActual?.roles?.includes('ADMIN') || false;
  }

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
    this.loteService.onGetLotesPorProducto(this.data.producto.id)
      .pipe(untilDestroyed(this))
      .subscribe((res: any[]) => {
        this.destinos = (res || []).map((l) => ({ id: +l.id, numeroLote: l.numeroLote }));
        this.cdr.markForCheck();
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
    // Tras un rechazo del servidor se recargan los saldos, pero se conserva el lote elegido si sigue con saldo.
    const origenPrevioId = this.form.origen?.loteId;
    this.origenes = [];
    this.form.origen = null;
    this.loteService.onGetStockPorLote(this.data.producto.id, this.sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: any[]) => {
          this.origenes = (res || [])
            .filter((l) => l.loteId != null && Number(l.cantidadDisponible) > 0)
            .map((l) => ({ loteId: +l.loteId, numeroLote: l.numeroLote, saldo: Number(l.cantidadDisponible) || 0 }));
          this.form.origen = this.origenes.find((o) => o.loteId === origenPrevioId) || null;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.notificacionService.openWarn('No se pudo leer el saldo de los lotes.', 5);
        }
      });
  }

  get destinosPosibles(): { id: number; numeroLote: string }[] {
    return this.destinos.filter((d) => d.id !== this.form.origen?.loteId);
  }

  get error(): string | null {
    if (this.sucursalId == null) {
      return 'Elegí la sucursal.';
    }
    return errorReasignar(this.form);
  }

  onGuardar(): void {
    if (this.error != null || this.guardando) {
      return;
    }
    this.guardando = true;
    const input = construirReasignar(this.form, {
      productoId: this.data.producto.id,
      sucursalId: this.sucursalId,
      usuarioId: this.mainService.usuarioActual?.id,
      referencia: this.referencia,
      forzar: this.esAdmin && this.forzar
    });
    this.loteService.onReasignarLote(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.guardando = false;
          if (res != null) {
            this.notificacionService.openSucess(`Listo: ${input.cantidad} pasaron al lote ${res.numeroLote}`);
            this.dialogRef.close(res);
          } else {
            this.cargar();
          }
        },
        error: (e) => {
          this.guardando = false;
          const aviso = avisoTrasMutacion(e, 'se pasaron las unidades');
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
