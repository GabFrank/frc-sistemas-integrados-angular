import { FormControl } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { PageInfo } from '../../../../app.component';
import { TimbradoService } from '../timbrado.service';
import { MainService } from '../../../../main.service';
import { Timbrado, TimbradoDetalle } from '../timbrado.modal';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
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
  
  timer;
  buscarControl = new FormControl(null);
  dataSource = new MatTableDataSource<any>([]);
  filtroTimbradoDetalleControl = new FormControl('');
  timbradoDetalleDataSource = new MatTableDataSource<any>([]);
  
  expandedTimbrado: any | null = null;

  /** Timbrados paginados en el central (#772), buscados por número. */
  pag: PaginacionLista<any> = new PaginacionLista<any>({
    cargar: (page, size) => this.timbradoService.onFindByNumero(this.buscarControl.value?.toUpperCase(), page, size, true).pipe(
      map(res => res ? {
        getTotalElements: res.getTotalElements,
        getContent: (res.getContent || []).map(timbrado => this.formatear(timbrado)),
      } : null)
    ),
    pageSize: 15,
    alCargar: (res) => this.dataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.dataSource.data = [];
    },
  });

  /** Detalles (puntos de expedición) del timbrado abierto, paginados en el central. */
  detallePag: PaginacionLista<any> = new PaginacionLista<any>({
    cargar: (page, size) => this.timbradoService.onGetTimbradoDetallesByTimbradoId(this.selectedTimbrado.id, page, size, true).pipe(
      map(res => res ? {
        getTotalElements: res.getTotalElements,
        getContent: (res.getContent || []).map(detalle => ({ ...detalle, sucursal: detalle.sucursal?.nombre || '-' })),
      } : null)
    ),
    pageSize: 10,
    pageSizeOptions: [10, 15, 25],
    alCargar: (res) => this.timbradoDetalleDataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.timbradoDetalleDataSource.data = [];
    },
  });

  constructor(
    private dialog: MatDialog,
    private mainService: MainService,
    private timbradoService: TimbradoService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit() {
    setTimeout(() => this.onSearch(), 0);

    this.setupSearchSubscription();
  }

  setupSearchSubscription() {
    this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
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

  /** Búsqueda nueva: vuelve a la página 1. */
  onSearch() {
    this.pag.filtrar();
  }

  private formatear(timbrado: any) {
    return {
      ...timbrado,
      fechaInicioFormateada: timbrado.fechaInicio ? dateToString(timbrado.fechaInicio, 'dd/MM/yyyy') : null,
      fechaFinFormateada: timbrado.fechaFin ? dateToString(timbrado.fechaFin, 'dd/MM/yyyy') : null,
      creadoEnFormateado: timbrado.creadoEn ? dateToString(timbrado.creadoEn, 'dd/MM/yyyy HH:mm') : null
    };
  }

  onResetFiltro() {
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

  /** `desdeLaPrimera`: al abrir otro timbrado; si no, repite la página (después de agregar o editar). */
  loadTimbradoDetalleData(timbradoId: number, desdeLaPrimera: boolean = false) {
    if (timbradoId == null) return;
    if (desdeLaPrimera) this.detallePag.filtrar();
    else this.detallePag.recargar();
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
        this.loadTimbradoDetalleData(targetTimbrado.id, esTimbradoDiferente);
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
        this.loadTimbradoDetalleData(this.selectedTimbrado.id);
      }
    })
  }

  onClickTimbradoDetalleRow(timbradoDetalle: TimbradoDetalle) {
    this.selectedTimbradoDetalle = timbradoDetalle;
    
    this.expandedTimbradoDetalle = this.expandedTimbradoDetalle === timbradoDetalle ? null : timbradoDetalle;
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

  clearTimbradoDetalleState() {
    this.expandedTimbradoDetalle = null;
    this.expandedTimbradoDetalleId = null; // Limpiar la propiedad simple
    this.timbradoDetalleDataSource.data = [];
    this.detallePag.limpiar();
  }

  forceRecreateDataSource() {

    this.timbradoDetalleDataSource = new MatTableDataSource<TimbradoDetalle>([]);
  }

}
