import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { LiquidacionSueldo, LiquidacionItem } from '../liquidacion.model';
import { DocumentoViewerDialogComponent } from '../../legajo/documento-viewer-dialog/documento-viewer-dialog.component';
import { LiquidacionService } from '../liquidacion.service';

export interface LiquidacionDetalleDialogData {
  liquidacion: LiquidacionSueldo;
}

@UntilDestroy()
@Component({
  selector: 'app-liquidacion-detalle-dialog',
  templateUrl: './liquidacion-detalle-dialog.component.html',
  styleUrls: ['./liquidacion-detalle-dialog.component.scss']
})
export class LiquidacionDetalleDialogComponent implements OnInit {

  liq: LiquidacionSueldo;
  itemsColumns = ['descripcion', 'tipo', 'monto', 'origen', 'acciones'];
  items = new MatTableDataSource<LiquidacionItem>([]);

  cajas: CajaVirtual[] = [];
  cajaControl = new FormControl(null);

  mostrarAgregar = false;
  descripcionControl = new FormControl(null);
  montoControl = new FormControl(0);
  tipoControl = new FormControl('DESCUENTO');
  tipoOptions = ['HABER', 'DESCUENTO'];

  cambiado = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: LiquidacionDetalleDialogData,
    private dialogRef: MatDialogRef<LiquidacionDetalleDialogComponent>,
    private dialog: MatDialog,
    private liquidacionService: LiquidacionService,
    private cajaVirtualService: CajaVirtualService,
    private dialogosService: DialogosService,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService
  ) {
    this.liq = data.liquidacion;
  }

  ngOnInit(): void {
    this.cargarItems();
    this.cajaVirtualService.onGetActivas()
      .pipe(untilDestroyed(this))
      .subscribe((res: CajaVirtual[]) => { this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR'); });
  }

  cargarItems() {
    this.liquidacionService.onGetItems(this.liq.id)
      .pipe(untilDestroyed(this)).subscribe(res => { this.items.data = res || []; });
  }

  private aplicar(res: any) {
    if (res != null) {
      this.liq = res;
      this.cambiado = true;
      this.cargarItems();
    }
  }

  onRegenerar() {
    this.liquidacionService.onGenerarBorrador(this.liq.funcionario?.id, this.liq.periodo, this.liq.moneda?.id)
      .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
  }

  onAgregarItem() {
    if (this.montoControl.value == null || this.montoControl.value <= 0) { return; }
    this.liquidacionService.onAgregarItem(
      this.liq.id,
      this.descripcionControl.value,
      this.montoControl.value,
      this.tipoControl.value
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.descripcionControl.reset(); this.montoControl.setValue(0); this.mostrarAgregar = false;
        this.cambiado = true;
        this.recargarCabecera();
      }
    });
  }

  onEliminarItem(it: LiquidacionItem) {
    this.liquidacionService.onEliminarItem(it.id)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) { this.cambiado = true; this.recargarCabecera(); } });
  }

  private recargarCabecera() {
    // recargar items y totales desde la cabecera por funcionario+periodo
    this.liquidacionService.onGetPorFuncionario(this.liq.funcionario?.id)
      .pipe(untilDestroyed(this)).subscribe((res: LiquidacionSueldo[]) => {
        const actual = (res || []).find(l => l.id === this.liq.id);
        if (actual) this.liq = actual;
        this.cargarItems();
      });
  }

  onAprobar() {
    this.liquidacionService.onAprobar(this.liq.id, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
  }

  onVolverBorrador() {
    this.liquidacionService.onVolverBorrador(this.liq.id)
      .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
  }

  onPagar() {
    if (this.cajaControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione la Caja Mayor', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.dialogosService.confirm(
      'Pagar liquidación',
      '¿Pagar el neto de ' + (this.liq.totalNeto || 0) + ' desde la Caja Mayor?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionService.onPagar(this.liq.id, this.cajaControl.value)
          .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
      }
    });
  }

  onAnular() {
    this.dialogosService.confirm(
      'Anular liquidación',
      '¿Anular esta liquidación pagada? Se generará el contra-asiento y se revertirán los efectos.',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionService.onAnular(this.liq.id)
          .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
      }
    });
  }

  onImprimirRecibo() {
    this.liquidacionService.onImprimirRecibo(this.liq.id).pipe(untilDestroyed(this)).subscribe((base64: string) => {
      if (!base64) {
        this.notificacion.notification$.next({ texto: 'No se pudo generar el recibo', color: NotificacionColor.warn, duracion: 3 });
        return;
      }
      // window.open() esta bloqueado en Electron; se muestra en un dialogo con iframe.
      const src = base64.startsWith('data:') ? base64 : 'data:application/pdf;base64,' + base64;
      this.dialog.open(DocumentoViewerDialogComponent, {
        data: { src, titulo: 'Recibo — ' + this.liq.periodo + ' — ' + (this.liq.funcionario?.persona?.nombre || '') },
        width: '80vw', maxWidth: '1000px'
      });
    });
  }

  onToggleAgregar() {
    this.mostrarAgregar = !this.mostrarAgregar;
    if (!this.mostrarAgregar) { this.descripcionControl.reset(); this.montoControl.setValue(0); }
  }

  onCerrar() {
    this.dialogRef.close(this.cambiado);
  }
}
