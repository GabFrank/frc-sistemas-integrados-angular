import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CajaVirtual, CajaVirtualTipoMovimiento } from '../caja-virtual.model';
import { AddMovimientoCajaVirtualDialogComponent, MovimientoDialogData } from '../add-movimiento-caja-virtual-dialog/add-movimiento-caja-virtual-dialog.component';
import { AddEntradaVariaDialogComponent, EntradaVariaDialogData } from '../../entrada-varia/add-entrada-varia-dialog/add-entrada-varia-dialog.component';
import { MaletinTesoreriaDialogComponent, MaletinTesoreriaDialogData } from '../../maletin/maletin-tesoreria-dialog/maletin-tesoreria-dialog.component';

interface OpcionIngreso {
  tipo: string;
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
}

@Component({
  selector: 'app-registrar-ingreso-dialog',
  templateUrl: './registrar-ingreso-dialog.component.html',
  styleUrls: ['./registrar-ingreso-dialog.component.scss']
})
export class RegistrarIngresoDialogComponent {

  opciones: OpcionIngreso[] = [
    { tipo: 'EFECTIVO', titulo: 'Ingreso de Efectivo', descripcion: 'Ingreso manual de efectivo a la caja', icono: 'payments', color: '#2e7d32' },
    { tipo: 'ENTRADA_VARIA', titulo: 'Entrada Varia', descripcion: 'Ingreso categorizado (cobros varios, otros)', icono: 'trending_up', color: '#1565c0' },
    { tipo: 'MALETIN', titulo: 'Ingreso de Maletín', descripcion: 'Recaudación que llega dentro de un maletín', icono: 'work', color: '#00838f' },
    { tipo: 'AJUSTE', titulo: 'Ajuste de Saldo', descripcion: 'Corrección positiva del saldo con motivo', icono: 'tune', color: '#6a1b9a' },
  ];

  constructor(
    private dialogRef: MatDialogRef<RegistrarIngresoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cajaVirtual: CajaVirtual },
    private dialog: MatDialog,
  ) {}

  seleccionar(op: OpcionIngreso) {
    if (op.tipo === 'ENTRADA_VARIA') {
      const d: EntradaVariaDialogData = { cajaVirtual: this.data.cajaVirtual, esIngreso: true };
      this.abrir(AddEntradaVariaDialogComponent, { width: '500px', data: d });
      return;
    }
    if (op.tipo === 'MALETIN') {
      const d: MaletinTesoreriaDialogData = { cajaVirtual: this.data.cajaVirtual, esEgreso: false };
      this.abrir(MaletinTesoreriaDialogComponent, { width: '480px', data: d });
      return;
    }
    // EFECTIVO o AJUSTE -> movimiento de caja
    const tipoMov = op.tipo === 'AJUSTE' ? CajaVirtualTipoMovimiento.AJUSTE : CajaVirtualTipoMovimiento.INGRESO;
    const d: MovimientoDialogData = { cajaVirtual: this.data.cajaVirtual, tipoMovimiento: tipoMov };
    this.abrir(AddMovimientoCajaVirtualDialogComponent, { width: '500px', data: d });
  }

  /** Abre el sub-diálogo y cierra este selector con su resultado (sin el hack de openDialogs). */
  private abrir(comp: any, config: any) {
    this.dialog.open(comp, config).afterClosed().subscribe(res => {
      if (res) this.dialogRef.close(res);
    });
  }

  cancelar() {
    this.dialogRef.close(null);
  }
}
