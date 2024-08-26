import { CajaService } from './../../../../financiero/pdv/caja/caja.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { MainService } from '../../../../../main.service';
import { CargandoDialogService } from '../../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { AdicionarCajaDialogComponent } from '../../../../financiero/pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component';
import { PdvCaja } from '../../../../financiero/pdv/caja/caja.model';
import { VentaTouchService } from '../venta-touch.service';

export class SeleccionarCajaDialogData {
  pdvCaja: PdvCaja
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-seleccionar-caja-dialog',
  templateUrl: './seleccionar-caja-dialog.component.html',
  styleUrls: ['./seleccionar-caja-dialog.component.scss']
})
export class SeleccionarCajaDialogComponent implements OnInit {
  ventaSub: Subscription;
  selectedCaja: PdvCaja;
  constructor(
    private ventaTouchService: VentaTouchService,
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarCajaDialogData,
    public dialogRef: MatDialogRef<SeleccionarCajaDialogComponent>,
    public mainService: MainService,
    private matDialog: MatDialog,
    private cargandoDialog: CargandoDialogService,
    private cajaService: CajaService
  ) { }

  ngOnInit(): void {
    if (this.cajaService?.selectedCaja != null) {
      this.abrirCaja()
    }

    this.ventaSub = this.ventaTouchService.cajaSub.pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.dialogRef.close(res)
      } else {

      }
    })
  }

  abrirCaja() {
    this.cargandoDialog.openDialog()
    setTimeout(() => {
      this.matDialog.open(AdicionarCajaDialogComponent, {
        data: {
          caja: this.cajaService?.selectedCaja
        },
        width: '90%',
        height: '95%',
        disableClose: true,
        autoFocus: true,
        restoreFocus: true
      }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      })
    }, 1000);
  }

  ventaCredito() {

  }

  onSalir() {
    this.dialogRef.close('salir')
  }

  consulta(){
    this.dialogRef.close('consulta')
  }


}
