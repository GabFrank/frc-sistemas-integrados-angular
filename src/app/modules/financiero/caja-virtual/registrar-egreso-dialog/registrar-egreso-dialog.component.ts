import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CajaVirtual, CajaVirtualTipoMovimiento } from '../caja-virtual.model';
import { AddMovimientoCajaVirtualDialogComponent, MovimientoDialogData } from '../add-movimiento-caja-virtual-dialog/add-movimiento-caja-virtual-dialog.component';
import { AddEntradaVariaDialogComponent, EntradaVariaDialogData } from '../../entrada-varia/add-entrada-varia-dialog/add-entrada-varia-dialog.component';
import { MaletinTesoreriaDialogComponent, MaletinTesoreriaDialogData } from '../../maletin/maletin-tesoreria-dialog/maletin-tesoreria-dialog.component';
import { PagarComprasDialogComponent, PagarComprasDialogData } from '../pagar-compras-dialog/pagar-compras-dialog.component';

interface OpcionEgreso {
  tipo: string;
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
}

@Component({
  selector: 'app-registrar-egreso-dialog',
  templateUrl: './registrar-egreso-dialog.component.html',
  styleUrls: ['./registrar-egreso-dialog.component.scss']
})
export class RegistrarEgresoDialogComponent {

  opciones: OpcionEgreso[] = [
    { tipo: 'EFECTIVO', titulo: 'Egreso de Efectivo', descripcion: 'Egreso manual de efectivo de la caja', icono: 'payments', color: '#c62828' },
    { tipo: 'ENTRADA_VARIA', titulo: 'Egreso Vario', descripcion: 'Egreso categorizado (gastos varios, otros)', icono: 'trending_down', color: '#e65100' },
    { tipo: 'MALETIN', titulo: 'Egreso de Maletín', descripcion: 'Efectivo que se despacha dentro de un maletín', icono: 'work', color: '#00838f' },
    { tipo: 'PAGO_CPP', titulo: 'Pagar Compras', descripcion: 'Pagar solicitudes de compra pendientes (CPP)', icono: 'shopping_cart_checkout', color: '#00695c' },
    { tipo: 'GASTO', titulo: 'Pagar Gasto', descripcion: 'Pagar o crear un gasto (ANDE, alquiler, servicios…)', icono: 'request_quote', color: '#5d4037' },
    { tipo: 'VALE', titulo: 'Pagar Vale', descripcion: 'Pagar o crear un vale/adelanto a funcionario', icono: 'receipt_long', color: '#ad1457' },
    { tipo: 'LIQUIDACION', titulo: 'Pagar Liquidación', descripcion: 'Pagar una liquidación mensual aprobada', icono: 'payments', color: '#1565c0' },
    { tipo: 'FINIQUITO', titulo: 'Pagar Finiquito', descripcion: 'Pagar una liquidación final aprobada', icono: 'logout', color: '#4527a0' },
    { tipo: 'AGUINALDO', titulo: 'Pagar Aguinaldo', descripcion: 'Pagar un aguinaldo aprobado (fuera de la liquidación)', icono: 'card_giftcard', color: '#00695c' },
    { tipo: 'AJUSTE', titulo: 'Ajuste de Saldo', descripcion: 'Corrección negativa del saldo con motivo', icono: 'tune', color: '#6a1b9a' },
  ];

  constructor(
    private dialogRef: MatDialogRef<RegistrarEgresoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cajaVirtual: CajaVirtual },
    private dialog: MatDialog,
  ) {}

  seleccionar(op: OpcionEgreso) {
    if (op.tipo === 'ENTRADA_VARIA') {
      const d: EntradaVariaDialogData = { cajaVirtual: this.data.cajaVirtual, esIngreso: false };
      this.abrir(AddEntradaVariaDialogComponent, { width: '500px', data: d });
      return;
    }
    if (op.tipo === 'MALETIN') {
      const d: MaletinTesoreriaDialogData = { cajaVirtual: this.data.cajaVirtual, esEgreso: true };
      this.abrir(MaletinTesoreriaDialogComponent, { width: '480px', data: d });
      return;
    }
    // Todos los conceptos pagables van por el mismo builder de pago; cambia el modo.
    if (op.tipo === 'PAGO_CPP' || op.tipo === 'GASTO' || op.tipo === 'VALE'
        || op.tipo === 'LIQUIDACION' || op.tipo === 'FINIQUITO' || op.tipo === 'AGUINALDO') {
      const modo: PagarComprasDialogData['modo'] =
        op.tipo === 'GASTO' ? 'GASTOS'
        : op.tipo === 'VALE' ? 'VALES'
        : op.tipo === 'PAGO_CPP' ? 'COMPRAS'
        : op.tipo;
      const d: PagarComprasDialogData = { cajaVirtual: this.data.cajaVirtual, modo };
      this.abrir(PagarComprasDialogComponent, { width: '65vw', maxWidth: '95vw', minWidth: '760px', height: '70vh', panelClass: 'pagar-compras-panel', data: d });
      return;
    }
    const tipoMov = op.tipo === 'AJUSTE' ? CajaVirtualTipoMovimiento.AJUSTE : CajaVirtualTipoMovimiento.EGRESO;
    const d: MovimientoDialogData = { cajaVirtual: this.data.cajaVirtual, tipoMovimiento: tipoMov, esEgreso: true };
    this.abrir(AddMovimientoCajaVirtualDialogComponent, { width: '500px', data: d });
  }

  private abrir(comp: any, config: any) {
    this.dialog.open(comp, config).afterClosed().subscribe(res => {
      if (res) this.dialogRef.close(res);
    });
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}
