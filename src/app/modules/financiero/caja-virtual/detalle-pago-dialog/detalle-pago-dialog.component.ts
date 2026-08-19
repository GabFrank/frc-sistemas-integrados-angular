import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PagarComprasService } from '../pagar-compras-dialog/pagar-compras.service';

export interface DetallePagoDialogData {
  /** Id del evento de pago. En el movimiento viaja como referenciaId / origenId. */
  pagoId: number;
  /** Etiqueta del movimiento, para encabezar el detalle. */
  descripcion?: string;
}

interface DetalleRow {
  solicitudPagoId: number;
  tipo: string;
  descripcion: string;
  proveedorNombre: string;
  monedaSimbolo: string;
  monedaDenominacion: string;
  decimales: number;
  montoImputado: number;
  montoTotal: number;
  montoPagado: number;
  estado: string;
  /** El documento quedó saldado con este pago (no arrastra saldo). */
  _saldado: boolean;
}

/**
 * Desglose de un evento de pago, abierto desde el movimiento de caja.
 *
 * <p>Un evento que paga N documentos postea <b>un</b> movimiento consolidado — que es lo
 * contablemente correcto y lo que la anulación revierte como unidad — así que su descripción
 * no puede nombrar a los N. Este diálogo responde esa pregunta leyendo el desglose real
 * (`detalleDePago`), en vez de embutir una lista en el texto del movimiento.</p>
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-detalle-pago-dialog',
  templateUrl: './detalle-pago-dialog.component.html',
  styleUrls: ['./detalle-pago-dialog.component.scss']
})
export class DetallePagoDialogComponent implements OnInit {

  displayedColumns = ['solicitud', 'tipo', 'descripcion', 'beneficiario', 'imputado', 'estado'];
  dataSource = new MatTableDataSource<DetalleRow>([]);
  isLoading = true;

  cantidad = 0;
  /** Total imputado por moneda: un evento puede pagar documentos en monedas distintas. */
  totales: { simbolo: string; denominacion: string; decimales: number; total: number }[] = [];

  private tipoLabels: Record<string, string> = {
    COMPRA: 'Compra',
    GASTO: 'Gasto',
    RRHH: 'RRHH',
  };

  constructor(
    private dialogRef: MatDialogRef<DetallePagoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetallePagoDialogData,
    private pagarComprasService: PagarComprasService,
  ) {}

  ngOnInit(): void {
    this.pagarComprasService.onGetDetalleDePago(this.data.pagoId)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isLoading = false;
        const filas: DetalleRow[] = (res || []).map((d: any) => this.toRow(d));
        this.dataSource.data = filas;
        this.cantidad = filas.length;
        this.totales = this.agruparPorMoneda(filas);
      });
  }

  private toRow(d: any): DetalleRow {
    const total = d.montoTotal || 0;
    const pagado = d.montoPagado || 0;
    return {
      solicitudPagoId: d.solicitudPagoId,
      tipo: this.tipoLabels[d.tipo] || d.tipo || '—',
      descripcion: d.descripcion || '—',
      proveedorNombre: d.proveedorNombre || '—',
      monedaSimbolo: d.monedaSimbolo || '',
      monedaDenominacion: d.monedaDenominacion || '',
      decimales: d.decimales != null ? d.decimales : 0,
      montoImputado: d.montoImputado || 0,
      montoTotal: total,
      montoPagado: pagado,
      estado: d.estado || '—',
      _saldado: total > 0 && pagado >= total,
    };
  }

  /** Un evento puede pagar documentos en monedas distintas: no se suman entre sí. */
  private agruparPorMoneda(filas: DetalleRow[]) {
    const porMoneda = new Map<string, { simbolo: string; denominacion: string; decimales: number; total: number }>();
    filas.forEach(f => {
      const clave = f.monedaDenominacion || '—';
      const acc = porMoneda.get(clave)
        || { simbolo: f.monedaSimbolo, denominacion: clave, decimales: f.decimales, total: 0 };
      acc.total += f.montoImputado;
      porMoneda.set(clave, acc);
    });
    return Array.from(porMoneda.values());
  }

  cerrar(): void { this.dialogRef.close(null); }
}
