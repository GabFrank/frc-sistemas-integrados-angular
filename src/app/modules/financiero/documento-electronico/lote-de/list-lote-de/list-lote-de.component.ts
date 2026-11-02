import { MatSort } from '@angular/material/sort';
import { LoteDeService } from '../lote-de.service';
import { MatDialog } from '@angular/material/dialog';
import { EstadoLoteDE, LoteDE } from '../lote-de.model';
import { PageInfo } from '../../../../../app.component';
import { MainService } from '../../../../../main.service';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { state, transition, trigger, animate, style } from '@angular/animations';
import { terminarSiFalla } from '../../../../../commons/core/utils/rxjsUtils';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-lote-de',
  templateUrl: './list-lote-de.component.html',
  styleUrls: ['./list-lote-de.component.scss'],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),  
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ]
})
export class ListLoteDeComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild(MatSort) sort: MatSort;

  estados: EstadoLoteDE[] = Object.values(EstadoLoteDE);
  dataSource = new MatTableDataSource<LoteDE>([]);
  respuestaControl = new FormControl(null);
  estadoControl = new FormControl(null);
  idControl = new FormControl(null)
  sucursalControl = new FormControl<number>(null);
  sucursales: Sucursal[] = [];
  sucursalNombre: { [id: number]: string } = {};
  fechaFormGroup = new FormGroup({
    fechaInicioControl : new FormControl(),
    fechaFinControl : new FormControl()
  })
  selectedLoteDe = new LoteDE();
  respuestas: LoteDE[] = [];
  fb = inject (FormBuilder)
  selectedRowIndex;

  displayedColumns: string [] = [
    "id",
    "sucursal",
    "protocolo",
    "estado",
    "fechaProcesado",
    "fechaUltimoIntento",
    "intentos",
    "respuestaSifen",
    "creadoEn",
    "actualizadoEn",
    "acciones",
  ]

  pageIndex = 0;
  pageSize = 15;
  selectedPageInfo: PageInfo<LoteDE>;

  constructor(
    private loteDeService: LoteDeService,
    public mainService: MainService,
    private tabService: TabService,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionSnackbarService,
  ) { }

  ngOnInit() {

    const today = new Date()
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    this.fechaFormGroup = this.fb.group({
      fechaInicioControl: [weekAgo],
      fechaFinControl: [today]
    })
    this.cargarSucursales();
    this.buscar();
  }

  // sucursalesSearch y no sucursales: esa query no manda size y el central la corta en 10.
  cargarSucursales() {
    this.sucursalService.onSearchSucursal(null).pipe(terminarSiFalla(), untilDestroyed(this)).subscribe(res => {
      this.sucursales = res || [];
      this.sucursalNombre = {};
      this.sucursales.forEach(s => this.sucursalNombre[s.id] = s.nombre);
    })
  }

  // Un filtro nuevo arranca en la página 1: la página actual puede no existir en el resultado filtrado.
  onSearch() {
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.buscar();
  }

  buscar() {
    if (this.idControl.value == null) {
      this.loteDeService.onGetAllLotes(
        this.pageIndex,
        this.pageSize,
        this.estadoControl.value,
        this.fechaFormGroup.get('fechaInicioControl')?.value,
        this.fechaFormGroup.get('fechaFinControl')?.value,
        true
      ).pipe(untilDestroyed(this)).subscribe(res => {
        if(res != null){
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent;
        }
      })
  } else {
    const id = this.idControl.value;
    const sucursalId = this.sucursalControl.value;
    if (sucursalId == null) {
      this.avisar('Elegí la sucursal del lote: el mismo ID existe en varias sucursales');
      return;
    }
    this.loteDeService.onFindByLoteId(id, sucursalId).pipe(
      // El genérico ya avisó el error: no dejar a la vista el resultado anterior.
      terminarSiFalla(() => this.mostrarLote(null)),
      untilDestroyed(this)
    ).subscribe(res => {
      this.mostrarLote(res);
      if (res == null) {
        this.avisar(`No se encontró el lote ${id} en esa sucursal`);
      }
    })
  }
  }

  // Un solo lote: el paginador no debe seguir mostrando el total de la lista.
  private mostrarLote(lote: LoteDE) {
    this.dataSource.data = lote != null ? [lote] : [];
    const pageInfo = new PageInfo<LoteDE>();
    pageInfo.getContent = this.dataSource.data;
    pageInfo.getTotalElements = this.dataSource.data.length;
    this.selectedPageInfo = pageInfo;
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
  }

  private avisar(texto: string) {
    this.notificacionService.notification$.next({ texto, color: NotificacionColor.warn, duracion: 3 });
  }

  onResetFiltro() {
    this.idControl.setValue(null);
    this.sucursalControl.setValue(null);
    this.estadoControl.setValue(null);
    this.onSearch();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.buscar();
  }

  getEstadoClass(estado: string | EstadoLoteDE): string {
    switch (estado) {
      case 'PENDIENTE_ENVIO':
        return 'chip-pendiente';
      case 'EN_PROCESO':
        return 'chip-proceso';
      case 'PROCESADO':
        return 'chip-procesado';
      case 'PROCESADO_CON_ERRORES':
        return 'chip-procesado-con-error'
      case 'ERROR_ENVIO':
        return 'chip-error-envio'
      case 'ERROR_RED':
        return 'chip-error-red'
      case 'ERROR_PERMANENTE':
        return 'chip-error-permanente';
      case 'RECHAZADO':
        return 'chip-rechazado';
      default:
        return 'chip-default';
    }
  }
}
