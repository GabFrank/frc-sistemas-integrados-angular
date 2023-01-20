import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { updateDataSource } from '../../../../commons/core/utils/numbersUtils';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Actualizacion, TipoActualizacion } from '../actualizacion.model';
import { ActualizacionService } from '../actualizacion.service';
import { EditActualizacionComponent } from '../edit-actualizacion/edit-actualizacion.component';


@UntilDestroy()
@Component({
  selector: 'app-list-actualizacion',
  templateUrl: './list-actualizacion.component.html',
  styleUrls: ['./list-actualizacion.component.scss'],
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
export class ListActualizacionComponent implements OnInit {

  tipoControl = new FormControl()

  displayedColumns = [
    'id',
    'currentVersion',
    'enabled',
    'nivel',
    'tipo',
    'usuario',
    'creadoEn',
    'acciones'
  ]

  tipoActualizacionList = Object.values(TipoActualizacion)

  dataSource = new MatTableDataSource<Actualizacion>([])
  isLastPage = false;
  expandedActualizacion;

  constructor(
    private actualizacionService: ActualizacionService,
    private cargandoService: CargandoDialogService,
    private matDialog: MatDialog,
    private dialogService: DialogosService
  ) { 
  }

  ngOnInit(): void {
    this.cargarDatos()
    
  }

  cargarDatos() {
    this.actualizacionService.onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.dataSource.data = res;
      })
  }

  onAdicionarVersion() {
    this.matDialog.open(EditActualizacionComponent, {
      width: '40%',
      disableClose: true
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.dataSource.data = updateDataSource(this.dataSource.data, res)
      }
    })
  }

  onEditVersion(item: Actualizacion, i) {
    this.matDialog.open(EditActualizacionComponent, {
      data: {
        actualizacion: item
      },
      width: '60%',
      disableClose: true
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.dataSource.data = updateDataSource(this.dataSource.data, res, i)
      }
    })
  }

  onFiltrar() {
    this.cargarDatos()
  }

  cargarMasDatos() { }

  onDelete(item: Actualizacion, i) {
    this.dialogService.confirm('Atención!!', 'Realmente desea eliminar este item?')
      .subscribe(res => {
        if (res) {
          this.actualizacionService.onDelete(item.id)
            .pipe(untilDestroyed(this))
            .subscribe(deleteResponse => {
              if (deleteResponse) {
                this.cargarDatos()
              }
            })
        }
      })
  }

}
