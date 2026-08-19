import { Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { CajaVirtual, CajaVirtualTipo } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { PageInfo } from '../../../../app.component';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { AddCajaVirtualDialogComponent } from '../add-caja-virtual-dialog/add-caja-virtual-dialog.component';
import { HistorialMovimientosCajaVirtualComponent } from '../historial-movimientos-caja-virtual/historial-movimientos-caja-virtual.component';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { CajaVirtualDashboardComponent } from '../caja-virtual-dashboard/caja-virtual-dashboard.component';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { GestionarAccesosCajaDialogComponent, GestionarAccesosCajaData } from '../gestionar-accesos-caja-dialog/gestionar-accesos-caja-dialog.component';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-caja-virtual',
  templateUrl: './list-caja-virtual.component.html',
  styleUrls: ['./list-caja-virtual.component.scss']
})
export class ListCajaVirtualComponent implements OnInit {

  @Input() data: Tab;

  dataSource = new MatTableDataSource<CajaVirtual>([]);
  isSearching = false;
  pageIndex = 0;
  pageSize = 10;
  selectedPageInfo: PageInfo<CajaVirtual>;

  tipoList = [
    { label: 'Caja Mayor', value: CajaVirtualTipo.CAJA_MAYOR },
    { label: 'Caja Chica', value: CajaVirtualTipo.CAJA_CHICA }
  ];

  tipoLabels: Record<string, string> = {
    [CajaVirtualTipo.CAJA_MAYOR]: 'Caja Mayor',
    [CajaVirtualTipo.CAJA_CHICA]: 'Caja Chica'
  };

  sucursalList: Sucursal[] = [];

  displayedColumns = [
    'id',
    'nombre',
    'tipo',
    'sucursal',
    'responsable',
    'saldoGs',
    'saldoRs',
    'saldoDs',
    'activo',
    'acciones'
  ];

  // Filtros
  nombreControl = new FormControl();
  tipoControl = new FormControl();
  sucursalControl = new FormControl();
  activoControl = new FormControl();

  puedeGestionar = false;
  esAdmin = false;

  constructor(
    private cajaVirtualService: CajaVirtualService,
    private sucursalService: SucursalService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private tabService: TabService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    this.esAdmin = this.mainService.tieneAlgunRol([ROLES.ADMIN]);
    this.sucursalService.onGetAllSucursales().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) this.sucursalList = res;
    });
    this.onFiltrar();
  }

  onFiltrar() {
    this.isSearching = true;
    this.cajaVirtualService.onGetFilter({
      nombre: this.nombreControl.value || null,
      tipo: this.tipoControl.value || null,
      sucursalId: this.sucursalControl.value || null,
      activo: (this.activoControl.value === null || this.activoControl.value === undefined) ? null : this.activoControl.value,
    }, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe((res: PageInfo<CajaVirtual>) => {
        this.isSearching = false;
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = this.marcarAdminAccesos(res.getContent);
        }
      });
  }

  onResetFiltro() {
    this.nombreControl.setValue(null);
    this.tipoControl.setValue(null);
    this.sucursalControl.setValue(null);
    this.activoControl.setValue(null);
    this.pageIndex = 0;
    this.onFiltrar();
  }

  onAdd() {
    this.dialog.open(AddCajaVirtualDialogComponent, {
      width: '500px',
      data: null
    }).afterClosed().subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  /**
   * Administrar la lista de accesos: solo el responsable de la caja (quien la creó) o un
   * ADMIN. El backend lo verifica igual — esconder la opción es comodidad, no seguridad.
   *
   * Se resuelve al cargar y no en el template: llamar funciones desde el HTML las re-evalúa
   * en cada ciclo de change detection.
   */
  private marcarAdminAccesos(rows: any[]): any[] {
    const yo = this.mainService.usuarioActual?.id;
    // Clonar: Apollo congela los resultados y asignar props sobre ellos tira TypeError en dev.
    return (rows || []).map(r => ({
      ...r,
      _puedeAdminAccesos: this.esAdmin || (!!yo && r?.usuario?.id === yo),
    }));
  }

  onGestionarAccesos(item: CajaVirtual) {
    const data: GestionarAccesosCajaData = { cajaVirtual: item };
    this.dialog.open(GestionarAccesosCajaDialogComponent, {
      width: '65vw', maxWidth: '95vw', height: '70vh', data
    }).afterClosed().subscribe(res => {
      // La transferencia de responsabilidad cambia quién puede administrar: recargar.
      if (res != null) this.onFiltrar();
    });
  }

  onEdit(item: CajaVirtual) {
    this.dialog.open(AddCajaVirtualDialogComponent, {
      width: '500px',
      data: item
    }).afterClosed().subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  onDelete(item: CajaVirtual) {
    this.dialogosService.confirm(
      'Eliminar Caja Virtual',
      `¿Está seguro que desea eliminar la caja "${item.nombre}"?`,
      null, null, true, 'Sí, eliminar', 'No'
    ).subscribe(confirmed => {
      if (confirmed === true) {
        this.cajaVirtualService.onDelete(item.id)
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res) {
              this.notificacion.openSucess('Caja virtual eliminada correctamente');
              this.onFiltrar();
            } else {
              this.notificacion.openAlgoSalioMal('No se pudo eliminar la caja virtual');
            }
          });
      }
    });
  }

  onVerDashboard(item: CajaVirtual) {
    this.tabService.addTab(
      new Tab(CajaVirtualDashboardComponent,
        `Caja: ${item.nombre}`,
        new TabData(item.id, item),
        ListCajaVirtualComponent
      )
    );
  }

  onHistorial(item: CajaVirtual) {
    this.dialog.open(HistorialMovimientosCajaVirtualComponent, {
      width: '95vw',
      maxWidth: '1400px',
      height: '85vh',
      data: item
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

}
