import { Component, Inject, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { PdvCaja } from "../../../financiero/pdv/caja/caja.model";
import { Venta } from "../venta.model";
import { VentaService } from "../venta.service";

class UltimasVentasDialogData {
  caja: PdvCaja;
  cancelacion?: boolean;
  reimpresion: boolean;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-ultimas-ventas-dialog",
  templateUrl: "./ultimas-ventas-dialog.component.html",
  styleUrls: ["./ultimas-ventas-dialog.component.scss"],
})
export class UltimasVentasDialogComponent implements OnInit {
  dataSource = new MatTableDataSource<Venta>([]);
  selectedVenta: Venta;
  codigoVentaControl = new FormControl();
  titulo = "";

  displayedColumns = [
    "id",
    "totalGs",
    "totalRs",
    "totalDs",
    "estado",
    "formaPago",
    "cliente",
    "acciones",
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UltimasVentasDialogData,
    private matDialogRef: MatDialogRef<UltimasVentasDialogComponent>,
    private ventaService: VentaService,
    private cargandoService: CargandoDialogService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private dialogService: DialogosService
  ) {
    if (data?.cancelacion == true) {
      this.titulo = "Cancelar venta";
    } else if (data?.reimpresion == true) {
      this.titulo = "Reimpresión de ticket";
    }
  }

  ngOnInit(): void {
    this.ventaService
      .onSearch(this.data.caja.id, this.dataSource.data.length).pipe(untilDestroyed(this))
      .subscribe((res) => {
        console.log(res);
        if (res != null) {
          this.dataSource.data = res;
        }
      });
  }

  buscarVentas() {
    this.ventaService
      .onSearch(this.data.caja.id, this.dataSource.data.length).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = res;
        }
      });
  }

  onBuscarPorCodigo() {
    console.log(this.codigoVentaControl.value != null);
    if (this.codigoVentaControl.value != null) {
      this.cargandoService.openDialog();
      this.ventaService
        .onGetPorId(this.codigoVentaControl.value).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog();
          if (res != null) {
            this.dataSource.data = [res];
          } else {
            this.notificacionSnackBar.notification$.next({
              texto:
                "Venta con código " +
                this.codigoVentaControl.value +
                " no encontrada.",
              color: NotificacionColor.warn,
              duracion: 3,
            });
          }
        });
    }
  }

  cancelarVenta(id) {
    this.cargandoService.openDialog(false, 'Cancelando venta');
    this.dialogService
      .confirm(
        "Realmente desea cancelar la venta " + id + "?",
        null,
        null,
        null
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.ventaService.onCancelarVenta(id).pipe(untilDestroyed(this)).subscribe((res) => {
            setTimeout(() => {
              this.cargandoService.closeDialog();
            }, 1000);
            if (res != null) {
              console.log("exito");
              this.dataSource.data = [];
              this.buscarVentas();
            }
          });
        }
      });
  }

  reimpresionVenta(id) {
    this.cargandoService.openDialog();
    this.ventaService.onReimprimirVenta(id).pipe(untilDestroyed(this)).subscribe((res) => {
      this.cargandoService.closeDialog();
      if (res != null) {
        console.log("exito");
      }
    });
  }
}
