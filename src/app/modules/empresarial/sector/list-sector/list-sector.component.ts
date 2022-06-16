import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { Sucursal } from '../../sucursal/sucursal.model';
import { SucursalService } from '../../sucursal/sucursal.service';
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
  displayedColumns = [
    'id',
    'sucursal',
    'nombre',
    'creadoEn',
    'acciones',
  ]

  constructor(
    private sucursalService: SucursalService,
    private sectorService: SectorService,
    private cargandoService: CargandoDialogService
  ) { }

  ngOnInit(): void {
    this.sucursalList = []
    this.sucursalService.onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.sucursalList = res.filter(s => s.id != 0);
      })
  }

  onFilter(){
    if(this.sucursalControl.value != null){
      this.cargandoService.openDialog()
      this.sectorService.onGetSectores(this.sucursalControl.value)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.cargandoService.closeDialog()
          this.dataSource.data = res;
        })
    }
  }

}
