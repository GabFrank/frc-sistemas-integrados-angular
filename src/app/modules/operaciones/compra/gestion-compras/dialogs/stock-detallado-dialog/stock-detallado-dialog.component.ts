import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Sucursal } from '../../../../../empresarial/sucursal/sucursal.model';
import { Presentacion } from '../../../../../productos/presentacion/presentacion.model';

export interface StockDetalladoDialogData {
  productoDescripcion: string;
  stockPorSucursal: Array<{
    sucursal: Sucursal;
    stock: number;
    loading: boolean;
  }>;
  stockTotal: number | null;
  presentaciones: Presentacion[];
}

interface FilaStock {
  sucursalNombre: string;
  stockRaw: number;
  stockDisplay: string;
  isNegativo: boolean;
}

@Component({
  selector: 'app-stock-detallado-dialog',
  templateUrl: './stock-detallado-dialog.component.html',
  styleUrls: ['./stock-detallado-dialog.component.scss']
})
export class StockDetalladoDialogComponent implements OnDestroy {
  displayedColumns = ['sucursal', 'stock'];
  filas: FilaStock[] = [];
  totalDisplay = '';
  presentacionControl: FormControl;
  presentacionesDisponibles: Presentacion[];
  showPresentacionSelect: boolean;

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<StockDetalladoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockDetalladoDialogData
  ) {
    this.presentacionesDisponibles = data.presentaciones || [];

    // Pre-seleccionar la presentación principal, o la primera activa
    const principal = this.presentacionesDisponibles.find(p => p.principal)
      || this.presentacionesDisponibles[0]
      || null;

    this.presentacionControl = new FormControl(principal);

    // Mostrar select solo si hay más de 1 presentación
    this.showPresentacionSelect = this.presentacionesDisponibles.length > 1;

    // Calcular filas iniciales
    this.recalcularFilas(principal);

    // Re-calcular al cambiar presentación
    this.presentacionControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((presentacion: Presentacion) => {
        this.recalcularFilas(presentacion);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCerrar(): void {
    this.dialogRef.close();
  }

  private recalcularFilas(presentacion: Presentacion | null): void {
    const cantidad = presentacion?.cantidad || 1;

    this.filas = (this.data.stockPorSucursal || []).map(entry => {
      const stockConvertido = (entry.stock ?? 0) / cantidad;
      return {
        sucursalNombre: entry.sucursal?.nombre || '—',
        stockRaw: entry.stock,
        stockDisplay: entry.loading ? '...' : this.formatStock(stockConvertido),
        isNegativo: !entry.loading && entry.stock < 0
      };
    });

    const totalPositivos = (this.data.stockPorSucursal || [])
      .filter(e => !e.loading && e.stock > 0)
      .reduce((acc, e) => acc + e.stock, 0);

    this.totalDisplay = this.formatStock(totalPositivos / cantidad);
  }

  private formatStock(value: number): string {
    return (value ?? 0).toLocaleString('es-PY', { maximumFractionDigits: 2 });
  }
}
