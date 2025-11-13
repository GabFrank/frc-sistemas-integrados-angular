import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { TabService } from '../../../../layouts/tab/tab.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { updateDataSource, updateDataSourceWithId } from '../../../../commons/core/utils/numbersUtils';
import { PageInfo } from '../../../../app.component';

import { Sucursal } from '../sucursal.model';
import { SucursalService } from '../sucursal.service';
import { EditSucursalDialogComponent } from '../edit-sucursal-dialog/edit-sucursal-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-sucursal',
  templateUrl: './list-sucursal.component.html',
  styleUrls: ['./list-sucursal.component.css'],
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
export class ListSucursalComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;

  readonly ROLES = ROLES;

  displayedColumns = [
    "id",
    "nombre",
    "localizacion",
    "ciudad",
    "deposito",
    "depositoPredeterminado",
    "codigoEstablecimientoFactura",
    "activo",
    "usuario",
    "acciones"
  ]
  buscarControl = new FormControl(null);
  depositoControl = new FormControl(null);
  activoControl = new FormControl(true); // Por defecto activo
  
  dataSource = new MatTableDataSource<Sucursal>([]);
  isLastPage = false;
  isSearching = false;
  expandedSucursal: Sucursal;
  timer;

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  selectedPageInfo: PageInfo<Sucursal>;

  constructor(
    private sucursalService: SucursalService,
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

    this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.pageIndex = 0;
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.onFiltrar()
      }, 500);
    })

    this.depositoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.pageIndex = 0;
      this.onFiltrar();
    })
  }

  onFiltrar() {
    const searchValue = this.buscarControl.value ? this.buscarControl.value.toUpperCase() : null;

    this.sucursalService.onSearchConFiltros(
      searchValue,
      this.depositoControl.value,
      this.activoControl.value ?? true,
      this.pageIndex, 
      this.pageSize
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = this.selectedPageInfo?.getContent || [];
      }
    })
  }

  resetFiltro() {
    this.pageIndex = 0;
    this.dataSource.data = [];
    this.selectedPageInfo = null;
    this.buscarControl.setValue(null);
    this.depositoControl.setValue(null);
    this.activoControl.setValue(true); // Resetear a activo por defecto
  }

  onEditSucursal(sucursal: Sucursal, i) {
    this.dialog.open(EditSucursalDialogComponent, {
      data: {
        sucursal: sucursal
      },
      width: '500px',
      disableClose: true
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.onFiltrar();
      }
    })
  }

  onNewSucursal() {
    this.dialog.open(EditSucursalDialogComponent, {
      width: '500px',
      disableClose: true
    }).afterClosed().subscribe((res: Sucursal) => {
      if (res != null) {
        this.onFiltrar();
      }
    })
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }
}
