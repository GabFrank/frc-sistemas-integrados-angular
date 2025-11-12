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
  ) { }

  ngOnInit() {

    const today = new Date()
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    this.fechaFormGroup = this.fb.group({
      fechaInicioControl: [weekAgo],
      fechaFinControl: [today]
    })
    this.onSearch();
  }

  onSearch() {
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
    this.loteDeService.onFindByLoteId(this.idControl.value).pipe(untilDestroyed(this)).subscribe(res => {
      if(res != null){
        this.dataSource.data = [res];
      }
    })
  }
  }

  onResetFiltro() {
    this.idControl.setValue(null);
    this.estadoControl.setValue(null);
    this.onSearch();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
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
