import { FormControl } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { PageInfo } from '../../../../app.component';
import { TimbradoService } from '../timbrado.service';
import { MainService } from '../../../../main.service';
import { Timbrado, TimbradoDetalle } from '../timbrado.modal';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { AddTimbradoDialogComponent } from '../add-timbrado-dialog/add-timbrado-dialog.component';
import { AddTimbradoDetalleDialogComponent } from '../add-timbrado-detalle-dialog/add-timbrado-detalle-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-timbrado',
  templateUrl: './list-timbrado.component.html',
  styleUrls: ['./list-timbrado.component.scss'],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({height: '0px', minHeight: '0'})),
      state("expanded", style({height: '*'})),
      transition("expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      )
    ])
  ]
})
export class ListTimbradoComponent implements OnInit {
  @Input() data;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('paginatorTimbrado') paginatorTimbrado: MatPaginator;
  @ViewChild('paginatorTimbradoDetalle') paginatorTimbradoDetalle: MatPaginator;

  displayedColumns = [
    "id",
    "razonSocial",
    "ruc",
    "numero",
    "fechaInicio",
    "fechaFin",
    "isElectronico",
    "activo",
    "creadoEn",
    "acciones"
  ]

  timbradoDetalleDisplayedColumns = [
    "id",
    "sucursal", 
    "caja",
    "puntoExpedicion",
    "activo",
    "acciones"
  ];

  selectedTimbrado: Timbrado;
  selectedTimbradoDetalle: TimbradoDetalle;
  expandedTimbradoDetalleId: string | null = null;
  expandedTimbradoDetalle: TimbradoDetalle | null = null;
  timbradoDetalleStates: Map<number, {
    expandedDetalle: TimbradoDetalle | null;
    dataSource: MatTableDataSource<any>;
    pageInfo: PageInfo<TimbradoDetalle>;
    pageIndex: number;
    pageSize: number;
  }> = new Map();
  
  timer;
  buscarControl = new FormControl(null);
  dataSource = new MatTableDataSource<any>([]);
  filtroTimbradoDetalleControl = new FormControl('');
  timbradoDetalleDataSource = new MatTableDataSource<any>([]);
  
  pageIndex = 0;
  pageSize = 15;
  pageEvent: PageEvent;
  paginatorUpdateTrigger = 0;
  currentTimbradoDetallePageIndex = 0;
  currentTimbradoDetallePageSize = 10;
  expandedTimbrado: any | null = null;
  selectedPageInfo: PageInfo<Timbrado>
  selectedTimbradoDetallePageInfo: PageInfo<TimbradoDetalle>;

  constructor(
    private dialog: MatDialog,
    private mainService: MainService,
    private timbradoService: TimbradoService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[0])
      this.pageSize = this.paginator.pageSizeOptions[0] 
      this.onSearch()
    }, 0);

    this.setupSearchSubscription();
  }

  setupSearchSubscription() {
    this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.pageIndex = 0;
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      if (res != null && res?.length > 0) {
        this.timer = setTimeout(() => {
          this.onSearch();
        }, 600);
      } else {
        this.onSearch();
      }
    });
  }

  onSearch() {
    this.timbradoService.onFindByNumero(
      this.buscarControl.value?.toUpperCase(), 
      this.pageIndex, 
      this.pageSize, true
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = this.selectedPageInfo?.getContent?.map(timbrado => ({
          ...timbrado,
          fechaInicioFormateada: timbrado.fechaInicio ? dateToString(timbrado.fechaInicio, 'dd/MM/yyyy') : null,
          fechaFinFormateada: timbrado.fechaFin ? dateToString(timbrado.fechaFin, 'dd/MM/yyyy') : null,
          creadoEnFormateado: timbrado.creadoEn ? dateToString(timbrado.creadoEn, 'dd/MM/yyyy HH:mm') : null
        })) || [];
      }
    })
  }

  onResetFiltro() {
    this.pageIndex = 0;
    this.dataSource.data = [];
    this.buscarControl.setValue(null);
  }

  onNewTimbrado() {
    this.dialog.open(AddTimbradoDialogComponent, {
      width: "50%",
      disableClose: false,
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.onSearch();
      }
    })
  }

  onEditTimbrado(timbradoConFormato: any, i: number) {
    const { 
      fechaInicioFormateada, 
      fechaFinFormateada, 
      creadoEnFormateado, 
      ...timbradoOriginal 
    } = timbradoConFormato;
    
    this.dialog.open(AddTimbradoDialogComponent, {
      data: {
        timbrado: timbradoOriginal
      },
      width: '50%',
      disableClose: false,
    }).afterClosed().subscribe(res => {
      if (res != null) {

        this.updateTimbradoInList(res, i);
      }
    })
  }

  updateTimbradoInList(timbradoEditado: any, index: number) {
    if (this.dataSource.data && this.dataSource.data[index]) {

      const timbradoFormateado = {
        ...timbradoEditado,
        fechaInicioFormateada: timbradoEditado.fechaInicio ? 
          dateToString(timbradoEditado.fechaInicio, 'dd/MM/yyyy') : null,
        fechaFinFormateada: timbradoEditado.fechaFin ? 
          dateToString(timbradoEditado.fechaFin, 'dd/MM/yyyy') : null,
        creadoEnFormateado: timbradoEditado.creadoEn ? 
          dateToString(timbradoEditado.creadoEn, 'dd/MM/yyyy HH:mm') : null
      };
      
      this.dataSource.data[index] = timbradoFormateado;
      this.dataSource._updateChangeSubscription();
    } else {
      this.onSearch();
    }
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onSearch();
  }
  
  onToggleTimbradoExpansion(timbrado: any) {
    this.expandedTimbrado = this.expandedTimbrado === timbrado ? null : timbrado;
    
    if (this.expandedTimbrado === timbrado) {
      this.onClickTimbradoRow(timbrado);
    } else {
      this.clearTimbradoDetalleState();
    }
  }

  onClickTimbradoRow(timbrado: any) {
    this.selectedTimbrado = timbrado;
    this.clearTimbradoDetalleState();
    this.forceRecreateDataSource();
    this.loadTimbradoDetalleData(timbrado.id, true);
  }

  loadTimbradoDetalleData(timbradoId: number, forceReload: boolean = false) {
    let state;
    
    if (forceReload) {
      this.timbradoDetalleStates.delete(timbradoId);
      state = this.getTimbradoDetalleState(timbradoId);
    } else {
      state = this.getTimbradoDetalleState(timbradoId);
    }
    
    this.timbradoService.onGetTimbradoDetallesByTimbradoId(
        timbradoId,
        state.pageIndex,
        state.pageSize,
        true
      ).pipe(untilDestroyed(this)).subscribe({
        next: (res) => {
          if (res) {
            state.pageInfo = res;
            
            const mappedData = res.getContent?.map(detalle => ({
              ...detalle,
              sucursal: detalle.sucursal?.nombre || '-',
            })) || [];
            
            state.dataSource.data = mappedData;
            
            this.timbradoDetalleDataSource.data = mappedData;
            this.selectedTimbradoDetallePageInfo = res;

            this.currentTimbradoDetallePageIndex = state.pageIndex;
            this.currentTimbradoDetallePageSize = state.pageSize;
            
            this.updatePaginatorState();
            
          } else {

            this.timbradoDetalleDataSource.data = [];
            this.selectedTimbradoDetallePageInfo = null;
          }
        },
        error: (error) => {
          console.error('Error al obtener TimbradoDetalle:', error);

          this.timbradoDetalleDataSource.data = [];
          this.selectedTimbradoDetallePageInfo = null;
        }
      });
  }

  onFilterTimbradoDetalle() {
    const state = this.getTimbradoDetalleState(this.selectedTimbrado.id);
    state.pageIndex = 0;
    this.currentTimbradoDetallePageIndex = 0;
    this.loadTimbradoDetalleData(this.selectedTimbrado.id, true);
  }

  handleTimbradoDetallePageEvent(e: PageEvent) {
    const state = this.getTimbradoDetalleState(this.selectedTimbrado.id);
    state.pageSize = e.pageSize;
    state.pageIndex = e.pageIndex;
    this.currentTimbradoDetallePageSize = e.pageSize;
    this.currentTimbradoDetallePageIndex = e.pageIndex;
    this.loadTimbradoDetalleData(this.selectedTimbrado.id, false);
  }

  onNewTimbradoDetalle(timbrado?: any) {
    const targetTimbrado = timbrado || this.selectedTimbrado;
      
    if (!targetTimbrado?.id) {
      this.notificacionService.openWarn('Debe seleccionar un Timbrado primero');
      return;
    }
      
    const esTimbradoDiferente = this.selectedTimbrado?.id !== targetTimbrado?.id;
    if (esTimbradoDiferente) {
      this.selectedTimbrado = targetTimbrado;
      this.clearTimbradoDetalleState();
      this.expandedTimbrado = targetTimbrado;
    }
      
    this.dialog.open(AddTimbradoDetalleDialogComponent, {
      data: {
        timbradoDetalle: null,
        timbrado: targetTimbrado
      },
      width: '50%',
      disableClose: false,
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.loadTimbradoDetalleData(targetTimbrado.id, true);
      }
    })
  }

  onEditTimbradoDetalle(timbradoDetalle: TimbradoDetalle, index: number) {
    this.dialog.open(AddTimbradoDetalleDialogComponent, {
      data: {
        timbradoDetalle: timbradoDetalle,
        timbrado: this.selectedTimbrado
      },
      width: '50%',
      disableClose: false,
    }).afterClosed().subscribe(res => {
      if (res != null) {

        this.loadTimbradoDetalleData(this.selectedTimbrado.id, true);
      }
    })
  }

  onClickTimbradoDetalleRow(timbradoDetalle: TimbradoDetalle) {
    this.selectedTimbradoDetalle = timbradoDetalle;
    
    const state = this.getTimbradoDetalleState(this.selectedTimbrado.id);
    state.expandedDetalle = state.expandedDetalle === timbradoDetalle ? null : timbradoDetalle;
    
    this.expandedTimbradoDetalle = state.expandedDetalle;
    this.expandedTimbradoDetalleId = this.expandedTimbradoDetalle?.id ? String(this.expandedTimbradoDetalle.id) : null;
  }

  isTimbradoRow = (index: number, rowData: any): boolean => {
    return rowData && typeof rowData.numero !== 'undefined';
  };
  
  isTimbradoDetalleRow = (index: number, rowData: any): boolean => {
    return rowData && (
      typeof rowData.cantidad !== 'undefined' || 
      typeof rowData.rangoDesde !== 'undefined' || 
      typeof rowData.puntoExpedicion !== 'undefined'
    );
  };

  updatePaginatorState() {
    this.paginatorUpdateTrigger++;
  }


  getTimbradoDetalleState(timbradoId: number) {
    if (!this.timbradoDetalleStates.has(timbradoId)) {
      this.timbradoDetalleStates.set(timbradoId, {
        expandedDetalle: null,
        dataSource: new MatTableDataSource<any>([]),
        pageInfo: null,
        pageIndex: 0,
        pageSize: 10
      });
    }
    return this.timbradoDetalleStates.get(timbradoId);
  }
  
  clearTimbradoDetalleState() {
    this.timbradoDetalleStates.clear();
    this.expandedTimbradoDetalle = null;
    this.expandedTimbradoDetalleId = null; // Limpiar la propiedad simple
    this.currentTimbradoDetallePageIndex = 0;
    this.currentTimbradoDetallePageSize = 10;
    this.timbradoDetalleDataSource.data = [];
    this.selectedTimbradoDetallePageInfo = null;
  }

  forceRecreateDataSource() {

    this.timbradoDetalleDataSource = new MatTableDataSource<TimbradoDetalle>([]);
    this.currentTimbradoDetallePageIndex = 0;
    this.currentTimbradoDetallePageSize = 10;
    this.selectedTimbradoDetallePageInfo = null;
  }

}
