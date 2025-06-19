import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PedidoItem } from '../../../edit-pedido/pedido-item.model';
import { PedidoItemSucursal } from '../../../pedido-item-sucursal/pedido-item-sucursal.model';

export interface SucursalDistributionDialogData {
  pedidoItem: PedidoItem;
}

export interface SucursalSummary {
  sucursalId: number;
  sucursalNombre: string;
  totalCantidad: number;
  distributionList: PedidoItemSucursal[];
}

@Component({
  selector: 'app-sucursal-distribution-dialog',
  templateUrl: './sucursal-distribution-dialog.component.html',
  styleUrls: ['./sucursal-distribution-dialog.component.scss']
})
export class SucursalDistributionDialogComponent {

  sucursalSummaries: SucursalSummary[] = [];
  totalDistribuido = 0;
  cantidadEsperada = 0;
  isDistributionComplete = false;

  displayedColumns = ['sucursal', 'cantidad', 'porcentaje'];

  constructor(
    public dialogRef: MatDialogRef<SucursalDistributionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SucursalDistributionDialogData
  ) {
    this.processSucursalDistribution();
  }

  private processSucursalDistribution(): void {
    const item = this.data.pedidoItem;
    
    // Calculate expected quantity
    this.cantidadEsperada = item.cantidadRecepcionNota || item.cantidadCreacion || 0;
    
    if (!item.pedidoItemSucursalList?.length) {
      return;
    }

    // Group by sucursal and sum quantities
    const sucursalMap = new Map<number, SucursalSummary>();
    
    item.pedidoItemSucursalList.forEach(dist => {
      if (dist.sucursalEntrega?.id) {
        const sucursalId = dist.sucursalEntrega.id;
        
        if (!sucursalMap.has(sucursalId)) {
          sucursalMap.set(sucursalId, {
            sucursalId: sucursalId,
            sucursalNombre: dist.sucursalEntrega.nombre || 'Sin nombre',
            totalCantidad: 0,
            distributionList: []
          });
        }
        
        const summary = sucursalMap.get(sucursalId)!;
        summary.totalCantidad += dist.cantidadPorUnidad || 0;
        summary.distributionList.push(dist);
      }
    });
    
    this.sucursalSummaries = Array.from(sucursalMap.values());
    this.totalDistribuido = this.sucursalSummaries.reduce((sum, s) => sum + s.totalCantidad, 0);
    this.isDistributionComplete = this.totalDistribuido === this.cantidadEsperada;
  }

  getPercentage(cantidad: number): string {
    if (this.cantidadEsperada === 0) return '0%';
    return ((cantidad / this.cantidadEsperada) * 100).toFixed(1) + '%';
  }

  close(): void {
    this.dialogRef.close();
  }
} 