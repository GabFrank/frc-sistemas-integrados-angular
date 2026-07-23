import { Component, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { PageInfo } from '../../../../app.component';
import { VentaTarjeta } from '../venta-tarjeta.model';
import { VentaTarjetaService } from '../venta-tarjeta.service';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { TerminalPosService } from '../../terminal-pos/terminal-pos.service';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { MatDialog } from '@angular/material/dialog';
import { ConfiguracionVentaTarjetaDialogComponent } from '../configuracion-venta-tarjeta-dialog/configuracion-venta-tarjeta-dialog.component';

@UntilDestroy()
@Component({
  selector: 'app-list-venta-tarjeta',
  templateUrl: './list-venta-tarjeta.component.html',
  styleUrls: ['./list-venta-tarjeta.component.scss']
})
export class ListVentaTarjetaComponent implements OnInit {

  ROLES = ROLES;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<VentaTarjeta>([]);
  displayedColumns = ['id', 'ventaId', 'sucursal', 'terminal', 'codigo', 'monto', 'montoEscaneado', 'estado', 'creadoEn'];
  selectedPageInfo: PageInfo<VentaTarjeta>;
  pageIndex = 0;
  pageSize = 15;
  today = new Date();
  fechaFormGroup: FormGroup;
  idControl = new FormControl(null);
  ventaIdControl = new FormControl(null);
  sucursalIdControl = new FormControl(null);
  terminalDescripcionControl = new FormControl(null);
  terminalCodigoControl = new FormControl(null);
  estadoControl = new FormControl(null);
  fechaDesdeControl = new FormControl(null);
  fechaHastaControl = new FormControl(null);

  sucursales: Sucursal[] = [];
  terminalesDescripciones: string[] = [];
  terminales: { descripcion: string; codigo: string }[] = [];
  estados = ['PENDIENTE', 'COMPLETADO', 'CANCELADO', 'NO_COMPLETADO'];

  get terminalesCodigos(): string[] {
    const desc = this.terminalDescripcionControl.value;
    const source = desc ? this.terminales.filter(t => t.descripcion === desc) : this.terminales;
    return [...new Set<string>(source.map(t => t.codigo).filter(Boolean))].sort();
  }

  constructor(
    private ventaTarjetaService: VentaTarjetaService,
    private sucursalService: SucursalService,
    private terminalPosService: TerminalPosService,
    public mainService: MainService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {

    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 5);

    this.fechaDesdeControl.setValue(aux);
    this.fechaHastaControl.setValue(hoy);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaDesdeControl,
      fin: this.fechaHastaControl,
    });

    this.sucursalService.onGetAllSucursales(true)
      .pipe(untilDestroyed(this))
      .subscribe(res => this.sucursales = res ?? []);

    this.terminalPosService.onFilter(null, null, true, 0, 200, true)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.terminales = (res?.getContent ?? []).map((t: any) => ({ descripcion: t.descripcion, codigo: t.codigo }));
        const descripciones = this.terminales.map(t => t.descripcion).filter(Boolean);
        this.terminalesDescripciones = [...new Set<string>(descripciones)].sort();
      });

    this.terminalDescripcionControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.terminalCodigoControl.setValue(null, { emitEvent: false }));

    this.onGetData();
  }

  onGetData(): void {
    const params: any = {
      page: this.pageIndex,
      size: this.pageSize
    };
    if (this.idControl.value) params.id = Number(this.idControl.value);
    if (this.ventaIdControl.value) params.ventaId = Number(this.ventaIdControl.value);
    if (this.sucursalIdControl.value) params.sucursalId = Number(this.sucursalIdControl.value);
    if (this.terminalDescripcionControl.value) params.terminalDescripcion = this.terminalDescripcionControl.value;
    if (this.terminalCodigoControl.value) params.terminalCodigo = this.terminalCodigoControl.value;
    if (this.estadoControl.value) params.estado = this.estadoControl.value;
    if (this.fechaDesdeControl.value) params.fechaDesde = new Date(this.fechaDesdeControl.value).toISOString().slice(0, 19);
    if (this.fechaHastaControl.value) {
      const hasta = new Date(this.fechaHastaControl.value);
      hasta.setHours(23, 59, 59);
      params.fechaHasta = hasta.toISOString().slice(0, 19);
    }

    this.ventaTarjetaService.onFiltrar(params)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent ?? [];
        }
      });
  }

  onFilter(): void {
    this.pageIndex = 0;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.onGetData();
  }

  onLimpiarFiltros(): void {
    this.idControl.setValue(null);
    this.ventaIdControl.setValue(null);
    this.sucursalIdControl.setValue(null);
    this.terminalDescripcionControl.setValue(null);
    this.terminalCodigoControl.setValue(null);
    this.estadoControl.setValue(null);
    this.fechaDesdeControl.setValue(null);
    this.fechaHastaControl.setValue(null);
    this.onFilter();
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onGetData();
  }

  onGenerarPdf(): void {
    const params: any = {};
    if (this.idControl.value) params.id = Number(this.idControl.value);
    if (this.ventaIdControl.value) params.ventaId = Number(this.ventaIdControl.value);
    if (this.sucursalIdControl.value) params.sucursalId = Number(this.sucursalIdControl.value);
    if (this.terminalDescripcionControl.value) params.terminalDescripcion = this.terminalDescripcionControl.value;
    if (this.terminalCodigoControl.value) params.terminalCodigo = this.terminalCodigoControl.value;
    if (this.estadoControl.value) params.estado = this.estadoControl.value;
    if (this.fechaDesdeControl.value) params.fechaDesde = new Date(this.fechaDesdeControl.value).toISOString().slice(0, 19);
    if (this.fechaHastaControl.value) {
      const hasta = new Date(this.fechaHastaControl.value);
      hasta.setHours(23, 59, 59);
      params.fechaHasta = hasta.toISOString().slice(0, 19);
    }

    this.ventaTarjetaService.onImprimirReporteVentaTarjeta(params);
  }

  onAbrirConfiguracion(): void {
    this.matDialog.open(ConfiguracionVentaTarjetaDialogComponent, {
      width: '560px',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });
  }
}
