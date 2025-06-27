import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Pedido } from '../../../../edit-pedido/pedido.model';
import { NotaRecepcionAgrupadaInfo, SolicitudPagoSummaryData } from '../../solicitud-pago.component';

export interface ConfirmarFinalizacionDialogData {
  pedido: Pedido;
  gruposCreados: NotaRecepcionAgrupadaInfo[];
  summaryData: SolicitudPagoSummaryData;
}

export interface ConfirmarFinalizacionDialogResult {
  accion: 'FINALIZAR' | 'CANCELAR';
}

@Component({
  selector: 'app-confirmar-finalizacion-dialog',
  templateUrl: './confirmar-finalizacion-dialog.component.html',
  styleUrls: ['./confirmar-finalizacion-dialog.component.scss']
})
export class ConfirmarFinalizacionDialogComponent implements OnInit {

  // Computed properties for template display
  proveedorNombre = '';
  totalValor = 0;
  totalValorDisplay = '';
  totalGrupos = 0;
  totalNotas = 0;
  solicitudesPorCrear = 0;
  
  // Enhanced grupos for display
  gruposDisplay: {
    titulo: string;
    cantidadNotas: number;
    valor: number;
    valorDisplay: string;
    estado: string;
    esExterno: boolean;
  }[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConfirmarFinalizacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmarFinalizacionDialogData
  ) {}

  ngOnInit(): void {
    this.computeDisplayData();
  }

  private computeDisplayData(): void {
    const { pedido, gruposCreados, summaryData } = this.data;
    
    // Basic info
    this.proveedorNombre = pedido.proveedor?.persona?.nombre || 'No especificado';
    
    // Calculate total valor by summing up individual grupo valores for accuracy
    this.totalValor = gruposCreados.reduce((total, grupoInfo) => total + (grupoInfo.valorTotal || 0), 0);
    this.totalValorDisplay = this.formatCurrency(this.totalValor);
    
    this.totalGrupos = gruposCreados.length;
    this.totalNotas = summaryData.notasAgrupadas;
    
    // SIMPLIFIED: Only ONE solicitud pago will be created for all grupos
    this.solicitudesPorCrear = 1;
    
    // Enhanced grupos for display
    this.gruposDisplay = gruposCreados.map(grupoInfo => ({
      titulo: `Grupo #${grupoInfo.grupo.id}`, // Simplified - no "external" distinction
      cantidadNotas: grupoInfo.notasAsignadas.length,
      valor: grupoInfo.valorTotal,
      valorDisplay: this.formatCurrency(grupoInfo.valorTotal),
      estado: grupoInfo.grupo.estado,
      esExterno: false // All grupos are now local
    }));
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount).replace('PYG', 'Gs.');
  }

  onConfirmar(): void {
    const result: ConfirmarFinalizacionDialogResult = {
      accion: 'FINALIZAR'
    };
    this.dialogRef.close(result);
  }

  onCancelar(): void {
    const result: ConfirmarFinalizacionDialogResult = {
      accion: 'CANCELAR'
    };
    this.dialogRef.close(result);
  }
} 