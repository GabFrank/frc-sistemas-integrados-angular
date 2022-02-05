import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AdicionarGastoDialogComponent } from '../../../../financiero/gastos/adicionar-gasto-dialog/adicionar-gasto-dialog.component';
import { AdicionarCajaDialogComponent } from '../../../../financiero/pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component';
import { PdvCaja } from '../../../../financiero/pdv/caja/caja.model';
import { AdicionarRetiroData, AdicionarRetiroDialogComponent } from '../../../../financiero/retiro/adicionar-retiro-dialog/adicionar-retiro-dialog.component';
import { UltimasVentasDialogComponent } from '../../../../operaciones/venta/ultimas-ventas-dialog/ultimas-ventas-dialog.component';
import { VentaTouchService } from '../venta-touch.service';
export class UtilitariosDialogData {
  caja: PdvCaja
}
@Component({
  selector: 'app-utilitarios-dialog',
  templateUrl: './utilitarios-dialog.component.html',
  styleUrls: ['./utilitarios-dialog.component.scss']
})
export class UtilitariosDialogComponent implements OnInit {

  selectedCaja: PdvCaja

  constructor(
    private ventaTouchService: VentaTouchService,
    @Inject(MAT_DIALOG_DATA) public data: UtilitariosDialogData,
    public dialogRef: MatDialogRef<UtilitariosDialogComponent>,
    public matDialog: MatDialog
  ) { 
    if(data?.caja!=null) this.selectedCaja = data.caja;
    console.log(this.selectedCaja)
  }

  ngOnInit(): void {
  }

  cerrarCaja(){
    this.matDialog.open(AdicionarCajaDialogComponent, {
      data: {
        caja: this.selectedCaja
      },
      width: '90%',
      height: '95vh',
      disableClose: true,
      autoFocus: true,
      restoreFocus: true    
    }).afterClosed().subscribe(res => {
      this.dialogRef.close(res)
    })
  }


  retiro(){
    this.matDialog.open(AdicionarRetiroDialogComponent, {
      data: {
        caja: this.selectedCaja
      },
      disableClose: true,
      autoFocus: true,
      restoreFocus: true    
    }).afterClosed().subscribe(res => {
      this.dialogRef.close()
    })
  }

  gasto(){
    this.matDialog.open(AdicionarGastoDialogComponent, {
      data: {
        caja: this.selectedCaja
      },
      width: '70%',
      height: '70%',
      disableClose: true,
      autoFocus: true,
      restoreFocus: true    
    }).afterClosed().subscribe(res => {
      this.dialogRef.close()
    })
  }

  cancelacionVenta(){
    this.matDialog.open(UltimasVentasDialogComponent, {
      data: {
        caja: this.selectedCaja,
        cancelacion: true
      },
      width: '70%',
      height: '70%',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true    
    }).afterClosed().subscribe(res => {
      this.dialogRef.close()
    })
  }

}


