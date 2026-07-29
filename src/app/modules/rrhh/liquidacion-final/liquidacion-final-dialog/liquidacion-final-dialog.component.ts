import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ReporteService } from '../../../reportes/reporte.service';
import { ReportesComponent } from '../../../reportes/reportes/reportes.component';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { LiquidacionFinal, LiquidacionFinalItem, MotivoEgreso } from '../liquidacion-final.model';
import { LiquidacionFinalService } from '../liquidacion-final.service';
import { LiquidacionFinalGenerarDialogComponent } from '../liquidacion-final-generar-dialog/liquidacion-final-generar-dialog.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

/**
 * Liquidación final / finiquito. Se abre en una TAB (no diálogo) para tener espacio
 * para la tabla de ítems editables — "todo es negociable": cada ítem (auto o manual)
 * se puede editar/agregar/eliminar en BORRADOR, y el total sigue a la suma de ítems.
 * Recibe funcionarioId/nombre vía TabData.
 */
@UntilDestroy()
@Component({
  selector: 'app-liquidacion-final-dialog',
  templateUrl: './liquidacion-final-dialog.component.html',
  styleUrls: ['./liquidacion-final-dialog.component.scss']
})
export class LiquidacionFinalDialogComponent implements OnInit {

  /** Tab inyectado por TabContentComponent. tabData.data = { funcionarioId, nombre, monedaId }. */
  @Input() data: Tab;

  funcionarioId: number;
  nombre: string;
  monedaId: number;
  tituloTab: string;

  liq: LiquidacionFinal = null;

  // Gating por rol (UX; el backend valida). ADMIN por rol o nickname.
  puedeLiquidar = false;
  puedeAprobar = false;
  puedePagar = false;

  itemsColumns = ['descripcion', 'tipo', 'monto', 'origen', 'acciones'];
  items = new MatTableDataSource<LiquidacionFinalItem>([]);

  cajas: CajaVirtual[] = [];
  cajaControl = new FormControl(null);

  // Panel dual alta/edición de ítem
  mostrarAgregar = false;
  editandoItemId: number = null;
  descripcionControl = new FormControl(null);
  montoControl = new FormControl(0);
  tipoControl = new FormControl('HABER');
  tipoOptions = ['HABER', 'DESCUENTO'];

  constructor(
    private tabService: TabService,
    private liquidacionFinalService: LiquidacionFinalService,
    private cajaVirtualService: CajaVirtualService,
    private dialogosService: DialogosService,
    private reporteService: ReporteService,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService,
    private dialog: MatDialog,
    private impresionService: ImpresionService
  ) { }

  ngOnInit(): void {
    const d = this.data?.tabData?.data || {};
    this.funcionarioId = d.funcionarioId ?? this.data?.tabData?.id;
    this.nombre = d.nombre;
    this.monedaId = d.monedaId;
    this.tituloTab = 'Finiquito — ' + (this.nombre || this.funcionarioId);

    const roles = this.mainService.usuarioActual?.roles || [];
    const esAdmin = this.mainService.usuarioActual?.nickname === 'ADMIN' || roles.includes('ADMIN');
    this.puedeLiquidar = esAdmin || roles.includes('RRHH LIQUIDAR');
    this.puedeAprobar = esAdmin || roles.includes('RRHH APROBAR');
    this.puedePagar = esAdmin || roles.includes('RRHH PAGAR');

    this.cargarExistente();
    this.cajaVirtualService.onGetActivas().pipe(untilDestroyed(this))
      .subscribe((res: CajaVirtual[]) => { this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR'); });
  }

  private cargarExistente() {
    this.liquidacionFinalService.onGetPorFuncionario(this.funcionarioId).pipe(untilDestroyed(this))
      .subscribe((res: LiquidacionFinal[]) => {
        const vigente = (res || []).find(l => l.estado !== 'ANULADA');
        if (vigente) { this.liq = vigente; this.items.data = vigente.items || []; }
      });
  }

  private recargarItems() {
    if (this.liq?.id == null) { return; }
    this.liquidacionFinalService.onGetItems(this.liq.id)
      .pipe(untilDestroyed(this)).subscribe(res => { this.items.data = res || []; });
  }

  /** Recarga cabecera (para el total recalculado) + items. */
  private recargar() {
    this.liquidacionFinalService.onGetPorFuncionario(this.funcionarioId).pipe(untilDestroyed(this))
      .subscribe((res: LiquidacionFinal[]) => {
        const vigente = (res || []).find(l => l.estado !== 'ANULADA');
        if (vigente) { this.liq = vigente; this.items.data = vigente.items || []; }
      });
  }

  private aplicar(res: any) {
    if (res != null) { this.liq = res; this.items.data = res.items || []; }
  }

  /** Regenerar reabre el diálogo de parámetros (prefilled) por si hay que cambiar
   *  motivo / preaviso / overrides antes de recalcular. */
  onRegenerar() {
    this.dialog.open(LiquidacionFinalGenerarDialogComponent, {
      data: {
        funcionarioId: this.funcionarioId,
        nombre: this.nombre,
        monedaId: this.monedaId,
        motivo: this.liq?.motivoEgreso,
        fecha: this.liq?.fechaEgreso,
        preavisoOtorgado: this.liq?.preavisoOtorgado,
        salarioBase: this.liq?.salarioPromedio,
        diasVacaciones: this.liq?.diasVacacionesNoGozadas
      },
      width: '640px', maxWidth: '95vw'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) { this.aplicar(res); } });
  }

  // --- Ítems editables ---
  onToggleAgregar() {
    this.mostrarAgregar = !this.mostrarAgregar;
    this.editandoItemId = null;
    this.descripcionControl.reset(); this.montoControl.setValue(0); this.tipoControl.setValue('HABER');
  }

  onEditarItemInit(it: LiquidacionFinalItem) {
    this.editandoItemId = it.id;
    this.descripcionControl.setValue(it.descripcion);
    this.montoControl.setValue(it.monto);
    this.tipoControl.setValue(it.tipo || 'HABER');
    this.mostrarAgregar = true;
  }

  onGuardarItem() {
    if (this.montoControl.value == null || this.montoControl.value < 0) { return; }
    const obs = this.editandoItemId != null
      ? this.liquidacionFinalService.onEditarItem(this.editandoItemId, this.descripcionControl.value,
          this.montoControl.value, this.tipoControl.value, this.mainService.usuarioActual?.id)
      : this.liquidacionFinalService.onAgregarItem(this.liq.id, this.descripcionControl.value,
          this.montoControl.value, this.tipoControl.value);
    obs.pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.editandoItemId = null;
        this.descripcionControl.reset(); this.montoControl.setValue(0); this.mostrarAgregar = false;
        this.recargar();
      }
    });
  }

  onEliminarItem(it: LiquidacionFinalItem) {
    this.liquidacionFinalService.onEliminarItem(it.id)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) { this.recargar(); } });
  }

  // --- Estados ---
  onAprobar() {
    this.liquidacionFinalService.onAprobar(this.liq.id, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
  }

  onVolverBorrador() {
    this.liquidacionFinalService.onVolverBorrador(this.liq.id)
      .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
  }

  onPagar() {
    if (this.cajaControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione la Caja Mayor', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.dialogosService.confirm(
      'Pagar liquidación final',
      '¿Pagar el finiquito de ' + (this.liq.totalLiquidado || 0) + ' desde la Caja Mayor? El funcionario quedará inactivo.',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionFinalService.onPagar(this.liq.id, this.cajaControl.value)
          .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
      }
    });
  }

  onAnular() {
    this.dialogosService.confirm(
      'Anular liquidación final',
      '¿Anular este finiquito pagado? Se generará el contra-asiento en la caja.',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionFinalService.onAnular(this.liq.id)
          .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
      }
    });
  }

  onImprimirRecibo() {
    this.impresionService.imprimir('Finiquito — ' + (this.nombre || this.liq.id),
      (anchoMm, escpos) => this.liquidacionFinalService.onImprimirRecibo(this.liq.id, anchoMm, escpos));
  }

  onCerrar() {
    const idx = this.tabService.getIndexByName(this.tituloTab);
    if (idx != null && idx > -1) { this.tabService.removeTab(idx); }
  }
}
