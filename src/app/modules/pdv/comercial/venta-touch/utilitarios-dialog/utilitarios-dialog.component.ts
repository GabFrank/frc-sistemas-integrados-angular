import { Component, Inject, OnInit } from "@angular/core";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { AdicionarGastoDialogComponent } from "../../../../financiero/gastos/adicionar-gasto-dialog/adicionar-gasto-dialog.component";
import { AdicionarCajaDialogComponent } from "../../../../financiero/pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component";
import { PdvCaja } from "../../../../financiero/pdv/caja/caja.model";
import {
  AdicionarRetiroData,
  AdicionarRetiroDialogComponent,
} from "../../../../financiero/retiro/adicionar-retiro-dialog/adicionar-retiro-dialog.component";
import { UltimasVentasDialogComponent } from "../../../../operaciones/venta/ultimas-ventas-dialog/ultimas-ventas-dialog.component";
import { GarantiaDevolucionDialogComponent } from "../../../venta-touch/garantia-devolucion-dialog/garantia-devolucion-dialog.component";
import { VentaTouchService } from "../venta-touch.service";
export class UtilitariosDialogData {
  caja: PdvCaja;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MainService } from "../../../../../main.service";
import { ROLES } from "../../../../personas/roles/roles.enum";

interface OpcionesData {
  expression: boolean;
  nombre: string;
  funcion: any;
}

export interface UtilitariosResponse {
  caja?: PdvCaja
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-utilitarios-dialog",
  templateUrl: "./utilitarios-dialog.component.html",
  styleUrls: ["./utilitarios-dialog.component.scss"],
})
export class UtilitariosDialogComponent implements OnInit {
  selectedCaja: PdvCaja;
  opcionesList: OpcionesData[] = []
  constructor(
    private ventaTouchService: VentaTouchService,
    @Inject(MAT_DIALOG_DATA) public data: UtilitariosDialogData,
    public dialogRef: MatDialogRef<UtilitariosDialogComponent>,
    public matDialog: MatDialog,
    private mainService: MainService
  ) {
    console.log(data)
    if (data?.caja != null) this.selectedCaja = data.caja;
  }

  ngOnInit(): void {
    this.opcionesList = [
      {
        nombre: 'Test',
        expression: this.selectedCaja != null,
        funcion: this.cerrarCaja
      }
    ]
  }

  abrir(index){
    this.opcionesList[index].funcion()
  }

  cerrarCaja() {
    this.matDialog
      .open(AdicionarCajaDialogComponent, {
        data: {
          caja: this.selectedCaja,
        },
        width: "90%",
        height: "95vh",
        disableClose: true,
        autoFocus: true,
        restoreFocus: true,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.dialogRef.close(res);
      });
  }

  retiro() {
    this.matDialog
      .open(AdicionarRetiroDialogComponent, {
        data: {
          caja: this.selectedCaja,
        },
        width: "100%",
        height: "70%",
        disableClose: true,
        autoFocus: true,
        restoreFocus: true,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.dialogRef.close(null);
      });
  }

  gasto() {
    this.matDialog
      .open(AdicionarGastoDialogComponent, {
        data: {
          caja: this.selectedCaja,
        },
        width: "100%",
        height: "70%",
        disableClose: true,
        autoFocus: true,
        restoreFocus: true,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.dialogRef.close(null);
      });
  }

  cancelacionVenta() {
    if (
      this.mainService.usuarioActual?.roles.includes(ROLES.CANCELACION_DE_VENTA)
    ) {
      this.matDialog
        .open(UltimasVentasDialogComponent, {
          data: {
            caja: this.selectedCaja,
            cancelacion: true,
          },
          width: "70%",
          height: "70%",
          disableClose: false,
          autoFocus: true,
          restoreFocus: true,
        })
        .afterClosed()
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.dialogRef.close(null);
        });
    }
  }

  reimpresionVenta() {
    this.matDialog
      .open(UltimasVentasDialogComponent, {
        data: {
          caja: this.selectedCaja,
          reimpresion: true,
          cancelacion: false,
        },
        width: "95%",
        height: "70%",
        disableClose: false,
        autoFocus: true,
        restoreFocus: true,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.dialogRef.close(null);
      });
  }

  garantia() {
    this.matDialog.open(GarantiaDevolucionDialogComponent, {
      data: {},
    });
  }
}
