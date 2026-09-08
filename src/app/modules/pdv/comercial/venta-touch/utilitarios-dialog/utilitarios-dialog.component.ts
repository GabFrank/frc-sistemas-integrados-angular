import { Component, Inject, OnInit } from "@angular/core";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { AdicionarGastoDialogComponent } from "../../../../financiero/gastos/dialogs/adicionar-gasto-dialog/adicionar-gasto-dialog.component";
import { AdicionarCajaDialogComponent } from "../../../../financiero/pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component";
import { PdvCaja } from "../../../../financiero/pdv/caja/caja.model";
import {
  AdicionarRetiroData,
  AdicionarRetiroDialogComponent,
} from "../../../../financiero/retiro/adicionar-retiro-dialog/adicionar-retiro-dialog.component";
import { UltimasVentasDialogComponent } from "../../../../operaciones/venta/ultimas-ventas-dialog/ultimas-ventas-dialog.component";
import { GarantiaDevolucionDialogComponent } from "../../../venta-touch/garantia-devolucion-dialog/garantia-devolucion-dialog.component";
import { VentaTouchService } from "../venta-touch.service";
import { VentasTarjetaCajaDialogComponent } from "../../../../financiero/venta-tarjeta/ventas-tarjeta-caja-dialog/ventas-tarjeta-caja-dialog.component";
import { ConfiguracionVentaTarjetaService } from "../../../../financiero/venta-tarjeta/configuracion-venta-tarjeta-dialog/configuracion-venta-tarjeta.service";
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

  /**
   * El aviso del cierre de caja manda al cajero a "registrarlas escaneando el QR desde el PDV",
   * pero la lista colgaba de sidebar > Reportes > Terminales POS > Lista: cuatro pasos y saliendo
   * del PDV. El rol VENTA TARJETA COMPLETAR abrio el permiso; esto abre el camino.
   *
   * Se precalcula (el template no puede llamar funciones) y exige las tres condiciones: sin caja
   * no hay nada que registrar, sin el flujo habilitado la pantalla no aplica, y sin el rol el
   * usuario no puede completar. Se gatea la VISIBILIDAD y no solo el click: un boton que siempre
   * se ve y a veces rechaza le ensena al cajero a probar suerte.
   */
  puedeRegistrarCupones = false;
  constructor(
    private ventaTouchService: VentaTouchService,
    @Inject(MAT_DIALOG_DATA) public data: UtilitariosDialogData,
    public dialogRef: MatDialogRef<UtilitariosDialogComponent>,
    public matDialog: MatDialog,
    private mainService: MainService,
    private configuracionVentaTarjetaService: ConfiguracionVentaTarjetaService
  ) {
    if (data?.caja != null) this.selectedCaja = data.caja;
  }

  ngOnInit(): void {
    const roles = this.mainService.usuarioActual?.roles || [];
    const tieneRol =
      roles.includes(ROLES.VENTA_TARJETA_COMPLETAR) || roles.includes(ROLES.ADMIN);

    if (this.selectedCaja != null && tieneRol) {
      // Contra el filial (false), igual que pago-touch: la caja se opera sin internet.
      this.configuracionVentaTarjetaService
        .onGetConfiguracion(false)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (config) => (this.puedeRegistrarCupones = config?.habilitado === true),
          error: () => (this.puedeRegistrarCupones = false),
        });
    }

    this.opcionesList = [
      {
        nombre: 'Test',
        expression: this.selectedCaja != null,
        funcion: this.cerrarCaja
      }
    ]
  }

  abrir(index) {
    this.opcionesList[index].funcion()
  }

  cerrarCaja() {
    this.matDialog
      .open(AdicionarCajaDialogComponent, {
        data: {
          caja: this.selectedCaja,
          isVentaTouch: true
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
        height: '650px',
        disableClose: true,
        autoFocus: true,
        restoreFocus: true,
        panelClass: 'darkMode',
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

  /**
   * Se abre como dialogo y no como tab a proposito: el cajero llega aca en medio de una venta o
   * justo antes de cerrar caja, y mandarlo a otra pestana lo saca del PDV.
   *
   * Muestra las de ESTA caja consultando al filial — no la lista del sidebar, que consulta al
   * central: esa necesita internet y trae las ventas de todas las sucursales.
   */
  ventasTarjeta() {
    this.matDialog
      .open(VentasTarjetaCajaDialogComponent, {
        data: { cajaId: this.selectedCaja?.id },
        width: "85vw",
        height: "80vh",
        disableClose: false,
        autoFocus: true,
        restoreFocus: true,
        panelClass: 'darkMode',
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.dialogRef.close(null);
      });
  }
}
