import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { ReporteService } from '../../../reportes/reporte.service';
import { ReportesComponent } from '../../../reportes/reportes/reportes.component';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { LiquidacionSueldo, LiquidacionItem } from '../liquidacion.model';
import { LiquidacionService } from '../liquidacion.service';

/**
 * Detalle de liquidación. Se abre en una TAB (no en diálogo) para poder comparar
 * varias liquidaciones abiertas a la vez. Recibe el id vía TabData y carga el resto.
 */
@UntilDestroy()
@Component({
  selector: 'app-liquidacion-detalle-dialog',
  templateUrl: './liquidacion-detalle-dialog.component.html',
  styleUrls: ['./liquidacion-detalle-dialog.component.scss']
})
export class LiquidacionDetalleDialogComponent implements OnInit {

  /** Tab completo inyectado por TabContentComponent. */
  @Input() data: Tab;

  liq: LiquidacionSueldo;
  itemsColumns = ['descripcion', 'tipo', 'monto', 'origen', 'acciones'];
  items = new MatTableDataSource<LiquidacionItem>([]);

  cajas: CajaVirtual[] = [];
  cajaControl = new FormControl(null);

  mostrarAgregar = false;
  editandoItemId: number = null;   // null = alta; id = edición
  descripcionControl = new FormControl(null);
  montoControl = new FormControl(0);
  tipoControl = new FormControl('DESCUENTO');
  tipoOptions = ['HABER', 'DESCUENTO'];

  // Gating por rol (UX; el backend valida de todas formas). ADMIN por rol o nickname.
  puedeLiquidar = false;
  puedeAprobar = false;
  puedePagar = false;

  constructor(
    private tabService: TabService,
    private liquidacionService: LiquidacionService,
    private cajaVirtualService: CajaVirtualService,
    private dialogosService: DialogosService,
    private reporteService: ReporteService,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    const roles = this.mainService.usuarioActual?.roles || [];
    const esAdmin = this.mainService.usuarioActual?.nickname === 'ADMIN' || roles.includes('ADMIN');
    this.puedeLiquidar = esAdmin || roles.includes('RRHH LIQUIDAR');
    this.puedeAprobar = esAdmin || roles.includes('RRHH APROBAR');
    this.puedePagar = esAdmin || roles.includes('RRHH PAGAR');
    const id = this.data?.tabData?.id ?? this.data?.tabData?.data?.id;
    if (id != null) {
      this.recargar(id);
    }
    this.cajaVirtualService.onGetActivas()
      .pipe(untilDestroyed(this))
      .subscribe((res: CajaVirtual[]) => { this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR'); });
  }

  /** Trae cabecera + items desde el backend por id. */
  private recargar(id?: number) {
    const liqId = id ?? this.liq?.id;
    if (liqId == null) { return; }
    this.liquidacionService.onGetById(liqId).pipe(untilDestroyed(this)).subscribe((res: LiquidacionSueldo) => {
      if (res != null) { this.liq = res; }
    });
    this.cargarItems(liqId);
  }

  private cargarItems(id?: number) {
    const liqId = id ?? this.liq?.id;
    if (liqId == null) { return; }
    this.liquidacionService.onGetItems(liqId)
      .pipe(untilDestroyed(this)).subscribe(res => { this.items.data = res || []; });
  }

  private aplicar(res: any) {
    if (res != null) {
      this.liq = res;
      this.cargarItems();
    }
  }

  onRegenerar() {
    this.liquidacionService.onGenerarBorrador(this.liq.funcionario?.id, this.liq.periodo, this.liq.moneda?.id)
      .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
  }

  /** Abre el panel en modo edición con los valores del item (todo es negociable). */
  onEditarItemInit(it: LiquidacionItem) {
    this.editandoItemId = it.id;
    this.descripcionControl.setValue(it.descripcion);
    this.montoControl.setValue(it.monto);
    this.tipoControl.setValue(it.tipo);
    this.mostrarAgregar = true;
  }

  /** Guarda el panel: edición si hay editandoItemId, alta si no. */
  onGuardarItem() {
    if (this.montoControl.value == null || this.montoControl.value < 0) { return; }
    const obs = this.editandoItemId != null
      ? this.liquidacionService.onEditarItem(this.editandoItemId, this.descripcionControl.value,
          this.montoControl.value, this.tipoControl.value, this.mainService.usuarioActual?.id)
      : this.liquidacionService.onAgregarItem(this.liq.id, this.descripcionControl.value,
          this.montoControl.value, this.tipoControl.value);
    obs.pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.editandoItemId = null;
        this.descripcionControl.reset(); this.montoControl.setValue(0); this.mostrarAgregar = false;
        this.recargar();
      }
    });
  }

  onEliminarItem(it: LiquidacionItem) {
    // Los items automaticos tambien se pueden eliminar (el backend nunca lo impidio,
    // solo exige BORRADOR). Ojo: "Regenerar" los vuelve a crear, porque generarBorrador
    // solo preserva los manuales — igual que ya pasa con la edicion de un automatico.
    const aviso = it.manual
      ? null
      : 'Es un item automatico: si volvés a generar el borrador, se recalcula y reaparece.';
    this.dialogosService.confirm(
      'Eliminar item',
      '¿Eliminar "' + (it.descripcion || '') + '" de la liquidación?',
      aviso, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionService.onEliminarItem(it.id)
          .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) { this.recargar(); } });
      }
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
      // Todos los PDF se ven en el visor integrado (tab "Reportes"), no en window.open.
      this.reporteService.onAdd(
        'Recibo ' + this.liq.periodo + ' - ' + (this.liq.funcionario?.persona?.nombre || this.liq.id), base64);
      this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, null));
    });
  }

  onToggleAgregar() {
    this.mostrarAgregar = !this.mostrarAgregar;
    if (!this.mostrarAgregar) { this.editandoItemId = null; this.descripcionControl.reset(); this.montoControl.setValue(0); }
    else { this.editandoItemId = null; this.descripcionControl.reset(); this.montoControl.setValue(0); this.tipoControl.setValue('DESCUENTO'); }
  }

  onCerrar() {
    // Cierra esta tab. El titulo se arma igual que al abrirla desde la lista.
    if (this.liq != null) {
      const idx = this.tabService.getIndexByName('Liquidación ' + this.liq.id);
      if (idx != null && idx > -1) { this.tabService.removeTab(idx); }
    }
  }
}
