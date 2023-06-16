import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { Sucursal } from '../../sucursal/sucursal.model';
import { SucursalService } from '../../sucursal/sucursal.service';
import { AdicionarZonaDialogComponent } from '../../zona/adicionar-zona-dialog/adicionar-zona-dialog.component';
import { Zona } from '../../zona/zona.model';
import { ZonaService } from '../../zona/zona.service';
import { AdicionarSectorDialogComponent } from '../adicionar-sector-dialog/adicionar-sector-dialog.component';
import { Sector } from '../sector.model';
import { SectorService } from '../sector.service';

@UntilDestroy()
@Component({
  selector: 'app-list-sector',
  templateUrl: './list-sector.component.html',
  styleUrls: ['./list-sector.component.scss'],
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
export class ListSectorComponent implements OnInit {

  selectedSucursal: Sucursal;
  sucursalList: Sucursal[]
  sucursalControl = new FormControl(null, Validators.required)
  nombreControl = new FormControl(null, Validators.required)
  dataSource = new MatTableDataSource<Sector>([])
  zonaDataSource = new MatTableDataSource<Zona>([])
  displayedColumns = [
    'id',
    'sucursal',
    'nombre',
    'activo',
    'creadoEn',
    'acciones',
  ]
  expandedElement;

  zonaColumnsToDisplay = [
    'id',
    'descripcion',
    'activo',
    'eliminar'
  ]

  selectedZona: Zona;


  constructor(
    private sucursalService: SucursalService,
    private sectorService: SectorService,
    private cargandoService: CargandoDialogService,
    private zonaService: ZonaService,
    private matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.sucursalList = []
    this.sucursalService.onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.sucursalList = res.filter(s => s.id != 0);
      })
  }

  onFilter() {
    if (this.sucursalControl.value != null) {
      this.selectedSucursal = this.sucursalControl.value;
      this.cargandoService.openDialog()
      this.sectorService.onGetSectores(this.selectedSucursal.id)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.cargandoService.closeDialog()
          this.dataSource.data = res;
        })
    }
  }

  onAdd() {
    this.matDialog.open(AdicionarSectorDialogComponent, {
      data: {
        sucursal: this.selectedSucursal
      },
      width: '50%'
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.dataSource.data = updateDataSource(this.dataSource.data, res)
      }
    })
  }

  onEdit(sector, i) {
    this.matDialog.open(AdicionarSectorDialogComponent, {
      data: {
        sector,
        sucursal: this.selectedSucursal
      },
      width: '50%'
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.dataSource.data = updateDataSource(this.dataSource.data, res, i)
      }
    })
  }

  onDeleteSector(sector, i) {
    this.sectorService.onDeleteSector(sector.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.dataSource.data = updateDataSource(this.dataSource.data, null, i)
        }
      })
  }

  onDeleteZona(zona, i) {
    this.zonaService.onDeleteZona(zona.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.zonaDataSource.data = updateDataSource(this.zonaDataSource.data, null, i)
        }
      })
  }

  onEditZona(zona, i) {
    this.matDialog.open(AdicionarZonaDialogComponent, {
      data: {
        sector: this.expandedElement,
        zona
      }
      ,
      width: '50%'
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.zonaDataSource.data = updateDataSource(this.zonaDataSource.data, res, i)
        // this.dataSource.data = updateDataSource(this.dataSource.data, this.zonaDataSource.data, i)
      }
    })
  }
  onAddZona(sector: Sector, i) {
    this.matDialog.open(AdicionarZonaDialogComponent, {
      data: {
        sector
      }
      ,
      width: '50%'
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.zonaDataSource.data = updateDataSource(this.zonaDataSource.data, res)
        // this.dataSource.data = updateDataSource(this.dataSource.data, this.zonaDataSource.data, i)
      }
    })
  }

}
