import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { ROLES } from '../../../personas/roles/roles.enum';
import { updateDataSource, updateDataSourceWithId } from '../../../../commons/core/utils/numbersUtils';
import { PageInfo } from '../../../../app.component';
import { SolicitudPago, SolicitudPagoEstado, TipoSolicitudPago } from '../solicitud-pago.model';
import { SolicitudPagoService } from '../solicitud-pago.service';
import { EditPagoComponent } from '../../pago/edit-pago/edit-pago.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-solicitud-pago',
  templateUrl: './list-solicitud-pago.component.html',
  styleUrls: ['./list-solicitud-pago.component.scss'],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListSolicitudPagoComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;

  readonly ROLES = ROLES;

  displayedColumns = [
    "id",
    "usuario",
    "creadoEn",
    "estado",
    "tipo",
    "referenciaId",
    "acciones"
  ]

  // Form controls for filters
  idControl = new FormControl(null);
  buscarControl = new FormControl(null); // Now used only for referenciaId
  estadoControl = new FormControl(null);
  tipoControl = new FormControl(null);
  
  dataSource = new MatTableDataSource<SolicitudPago>([]);
  isLastPage = false;
  isSearching = false;
  expandedSolicitudPago: SolicitudPago;
  timer;
  
  estadoList = Object.keys(SolicitudPagoEstado);
  tipoList = Object.keys(TipoSolicitudPago);

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  selectedPageInfo: PageInfo<SolicitudPago>;

  constructor(
    private solicitudPagoService: SolicitudPagoService,
    public mainService: MainService,
    private tabService: TabService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1])
      this.pageSize = this.paginator.pageSizeOptions[1]
      this.onFiltrar()
    }, 0);

    //do not add any value change filter
  }

  onFiltrar() {
    // Check if we have a valid ID - if so, prioritize it in the search
    const solicitudId = this.idControl.value;
    this.isSearching = true;
    
    // Call the service with all filters, prioritizing ID if present
    this.solicitudPagoService.onSearchConFiltros(
      solicitudId && !isNaN(solicitudId) ? Number(solicitudId) : null,
      this.buscarControl.value, // referenciaId
      this.tipoControl.value,
      this.estadoControl.value,
      null, // fechaInicio - podría implementarse con un rango de fechas
      null, // fechaFin - podría implementarse con un rango de fechas
      this.pageIndex,
      this.pageSize
    )
    .pipe(untilDestroyed(this))
    .subscribe(
      (res) => {
        this.isSearching = false;
        if (res) {
          this.selectedPageInfo = res;
          this.dataSource.data = this.selectedPageInfo.getContent;
          
          // Actualizar información de paginación
          this.isLastPage = this.selectedPageInfo.isLast;
        } else {
          this.dataSource.data = [];
          this.selectedPageInfo = null;
        }
      },
      (error) => {
        this.isSearching = false;
        console.error('Error al filtrar solicitudes de pago:', error);
        this.dataSource.data = [];
      }
    );
  }

  /**
   * Navega a la pantalla de crear/editar pago para la solicitud de pago seleccionada
   * @param solicitudPago La solicitud de pago seleccionada
   */
  onCrearEditarPago(solicitudPago: SolicitudPago): void {
    // Dynamic import to avoid circular dependencies

        this.tabService.addTab(
          new Tab(
            EditPagoComponent,
            `Pago para solicitud #${solicitudPago.id}`,
            new TabData(solicitudPago.id, { solicitudPagoId: solicitudPago.id }),
            ListSolicitudPagoComponent
          )
        );
  }

  resetFiltro() {
    this.pageIndex = 0;
    this.dataSource.data = [];
    this.selectedPageInfo = null;
    this.idControl.setValue(null, { emitEvent: false });
    this.buscarControl.setValue(null, { emitEvent: false });
    this.estadoControl.setValue(null, { emitEvent: false });
    this.tipoControl.setValue(null, { emitEvent: false });
    // Cargar datos iniciales después de resetear
    this.onFiltrar();
  }

  onEditSolicitudPago(solicitudPago: SolicitudPago, i) {
    // In a real app, you would open a dialog to edit the entity
    // For now, we'll just log it
    console.log('Edit SolicitudPago:', solicitudPago);
    
    // Example of dialog implementation (commented out for now)
    /*
    this.dialog.open(EditSolicitudPagoDialogComponent, {
      data: {
        solicitudPago: solicitudPago
      },
      width: '60%',
      disableClose: true
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.dataSource.data = updateDataSourceWithId(this.dataSource.data, res, solicitudPago.id);
        this.table.renderRows();
      }
    });
    */
  }

  onNewSolicitudPago() {
    // In a real app, you would open a dialog to create a new entity
    // For now, we'll just log it
    console.log('Create new SolicitudPago');
    
    // Example of dialog implementation (commented out for now)
    /*
    this.dialog.open(EditSolicitudPagoDialogComponent, {
      width: '60%',
      disableClose: true
    }).afterClosed().subscribe((res: SolicitudPago) => {
      if (res != null) {
        this.onFiltrar();
      }
    });
    */
  }

  onViewDetails(solicitudPago: SolicitudPago) {
    console.log('View details for SolicitudPago:', solicitudPago);
    // Implement navigation or detail display logic here
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }
} 