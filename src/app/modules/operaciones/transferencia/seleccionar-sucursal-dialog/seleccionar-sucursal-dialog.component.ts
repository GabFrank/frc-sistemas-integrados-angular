import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { MainService } from './../../../../main.service';
import { CargandoDialogService } from './../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { SucursalService } from './../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from './../../../empresarial/sucursal/sucursal.model';
import { MatDialog } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { animate, trigger, state, style, transition } from '@angular/animations';
import { comparatorLike } from '../../../../commons/core/utils/string-utils';

@UntilDestroy()
@Component({
  selector: 'app-seleccionar-sucursal-dialog',
  templateUrl: './seleccionar-sucursal-dialog.component.html',
  styleUrls: ['./seleccionar-sucursal-dialog.component.scss'],
  animations: [
    trigger("slideInOut", [
      state(
        "in",
        style({
          transform: "translate3d(0,0,0)",
        })
      ),
      state(
        "out",
        style({
          transform: "translate3d(100%, 0, 0)",
        })
      ),
      transition("in => out", animate("750ms ease-in-out")),
      // transition("out => in", animate("400ms ease-in-out")),
    ]),
  ],
})
export class SeleccionarSucursalDialogComponent implements OnInit {
  sucursalList: Sucursal[]
  filteredOrigenSucursalList: Sucursal[]
  filteredDestinoSucursalList: Sucursal[]
  selectedSucursalOrigen: Sucursal
  selectedSucursalDestino: Sucursal
  selectedOptions;
  iconState: string = "in";
  buscarOrigenControl = new FormControl()
  buscarDestinoControl = new FormControl()

  constructor(
    private matDialoRef: MatDialogRef<SeleccionarSucursalDialogComponent>,
    private cargandoService: CargandoDialogService,
    private matDialog: MatDialog, private sucursalService: SucursalService,
    private mainService: MainService
    ) { }

  ngOnInit(): void {
    this.cargandoService.openDialog()
    this.sucursalService.onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.sucursalList = res.filter(s => s.id != 0)
          this.filteredOrigenSucursalList = this.sucursalList;
        }
        this.cargandoService.closeDialog()
      })

    setInterval(() => {
      if (this.iconState === 'in') {
        this.iconState = 'out'
      } else {
        this.iconState = 'in'
      }
    }, 1500)
  }

  onOrigenChange(e: Sucursal) {
    this.selectedSucursalOrigen = e;
    this.filteredDestinoSucursalList = this.sucursalList.filter(s => s.id != e.id)
  }

  onDestinoChange(e: Sucursal) {
    this.selectedSucursalDestino = e;
  }

  onOrigenFilter(){
    let texto = this.buscarOrigenControl.value;
    this.filteredOrigenSucursalList = this.sucursalList.filter(s => comparatorLike(texto, s.nombre))
  }

  onDestinoFilter(){
    let texto: string = this.buscarDestinoControl.value;
    this.filteredDestinoSucursalList = this.sucursalList.filter(s => comparatorLike(texto, s.nombre) && s.id != this.selectedSucursalOrigen.id)
  }

  onCancelar(){
    this.matDialoRef.close()
  }

  onConfirmar(){
    this.matDialoRef.close({sucursalOrigen: this.selectedSucursalOrigen, sucursalDestino: this.selectedSucursalDestino})
  }
}
