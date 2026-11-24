import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { TabService } from '../../../../layouts/tab/tab.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';

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

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;

  readonly ROLES = ROLES;

  displayedColumns = [
    "id",
    "nombre",
    "localizacion",
    "ciudad",
    "ip",
    "puertoServidor",
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
  
  pag = new PaginacionLista<Sucursal>({
    cargar: (page, size) => this.sucursalService.onSearchConFiltros(
      this.buscarControl.value ? this.buscarControl.value.toUpperCase() : null,
      this.depositoControl.value,
      this.activoControl.value ?? true,
      page,
      size
    ),
    pageSize: 25,
  });
  isLastPage = false;
  isSearching = false;
  expandedSucursal: Sucursal;
  timer;

  // Opciones para el filtro de estado activo
  activoOptions = [
    { value: 'TODAS', label: 'Todas' },
    { value: 'ACTIVAS', label: 'Activas' },
    { value: 'INACTIVAS', label: 'Inactivas' }
  ];

  constructor(
    private sucursalService: SucursalService,
    public mainService: MainService,
    private tabService: TabService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.pag.filtrar();

    this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.onFiltrar()
      }, 500);
    })

    this.depositoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.onFiltrar();
    })

    this.activoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.onFiltrar();
    })
  }

  // Filtrar, Buscar y Enter vuelven a la página 1.
  onFiltrar() {
    clearTimeout(this.timer);
    this.pag.filtrar();
  }

  resetFiltro() {
    this.pag.limpiar();
    // Sin emitEvent: cada valueChanges consultaría con el filtro a medio limpiar.
    this.buscarControl.setValue(null, { emitEvent: false });
    this.depositoControl.setValue(null, { emitEvent: false });
    this.activoControl.setValue(true, { emitEvent: false }); // Resetear a activo por defecto
    this.onFiltrar();
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
        this.pag.recargar();
      }
    })
  }

  onNewSucursal() {
    this.dialog.open(EditSucursalDialogComponent, {
      width: '500px',
      disableClose: true
    }).afterClosed().subscribe((res: Sucursal) => {
      if (res != null) {
        this.pag.recargar();
      }
    })
  }
}