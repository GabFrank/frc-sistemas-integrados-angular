import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CajaVirtual, CajaVirtualTipoMovimiento } from '../caja-virtual.model';
import { AddMovimientoCajaVirtualDialogComponent, MovimientoDialogData } from '../add-movimiento-caja-virtual-dialog/add-movimiento-caja-virtual-dialog.component';
import { AddEntradaVariaDialogComponent, EntradaVariaDialogData } from '../../entrada-varia/add-entrada-varia-dialog/add-entrada-varia-dialog.component';
import { MaletinTesoreriaDialogComponent, MaletinTesoreriaDialogData } from '../../maletin/maletin-tesoreria-dialog/maletin-tesoreria-dialog.component';
import { RegistrarValeDialogComponent, RegistrarValeDialogData } from '../registrar-vale-dialog/registrar-vale-dialog.component';
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
    { tipo: 'VALE', titulo: 'Registrar Vale', descripcion: 'Adelanto/vale a funcionario (egresa al confirmar)', icono: 'receipt_long', color: '#ad1457' },
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
    if (op.tipo === 'VALE') {
      const d: RegistrarValeDialogData = { cajaVirtual: this.data.cajaVirtual };
      this.abrir(RegistrarValeDialogComponent, { width: '500px', data: d });
      return;
    }
    if (op.tipo === 'PAGO_CPP') {
      const d: PagarComprasDialogData = { cajaVirtual: this.data.cajaVirtual };
      this.abrir(PagarComprasDialogComponent, { width: '60vw', maxWidth: '95vw', minWidth: '760px', height: '65vh', panelClass: 'pagar-compras-panel', data: d });
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
