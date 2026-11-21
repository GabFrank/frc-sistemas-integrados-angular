import { MatSort } from '@angular/material/sort';
import { LoteDeService } from '../lote-de.service';
import { MatDialog } from '@angular/material/dialog';
import { EstadoLoteDE, LoteDE } from '../lote-de.model';
import { MainService } from '../../../../../main.service';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PaginacionLista, PaginaCentral } from '../../../../../shared/components/paginacion/paginacion-lista';
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

  /** Lotes paginados en el central (#772); con un id, una página con ese lote. */
  pag: PaginacionLista<LoteDE> = new PaginacionLista<LoteDE>({
    cargar: (page, size) => this.consultar(page, size),
    pageSize: 15,
    alCargar: (res) => this.dataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.dataSource.data = [];
    },
  });

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
    this.pag.filtrar();
  }

  buscar() {
    this.pag.recargar();
  }

  private consultar(page: number, size: number): Observable<PaginaCentral<LoteDE> | null> {
    if (this.idControl.value == null) {
      return this.loteDeService.onGetAllLotes(
        page,
        size,
        this.estadoControl.value,
        this.fechaFormGroup.get('fechaInicioControl')?.value,
        this.fechaFormGroup.get('fechaFinControl')?.value,
        true
      );
    }
    const id = this.idControl.value;
    const sucursalId = this.sucursalControl.value;
    if (sucursalId == null) {
      this.avisar('Elegí la sucursal del lote: el mismo ID existe en varias sucursales');
      return of(null);
    }
    // Un solo lote: el paginador no sigue mostrando el total de la lista.
    return this.loteDeService.onFindByLoteId(id, sucursalId).pipe(
      map(lote => {
        if (lote == null) this.avisar(`No se encontró el lote ${id} en esa sucursal`);
        return { getContent: lote != null ? [lote] : [], getTotalElements: lote != null ? 1 : 0 };
      }),
      // El genérico ya avisó el error: no dejar a la vista el resultado anterior.
      catchError(() => of({ getContent: [], getTotalElements: 0 }))
    );
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
