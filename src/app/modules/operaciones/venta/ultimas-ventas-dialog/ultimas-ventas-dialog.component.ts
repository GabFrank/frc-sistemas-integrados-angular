import { Component, Inject, OnInit, ViewChild } from "@angular/core";
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
import { MatPaginator } from "@angular/material/paginator";
import { catchError, map, merge, startWith, switchMap, Observable, of as observableOf } from "rxjs";
import { VentaEstado } from "../enums/venta-estado.enums";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";

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
    "modo",
    "precioDelivery",
    "totalGs",
    "totalRs",
    "totalDs",
    "estado",
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
      .onSearch(null, this.data.caja.id, 0, 20, false).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = res.getContent;
        }
      });
  }

  buscarVentas() {
    this.ventaService
      .onSearch(null, this.data.caja.id, this.dataSource.data.length).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = res.getContent;
        }
      });
  }


  onBuscarPorCodigo() {
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

  cancelarVenta(venta: Venta, index) {
    this.dialogService
      .confirm(
        "Atención!!",
        "Realmente desea cancelar la venta " + venta.id + "?",
        "Al cancelar una venta debe escribir el motivo de canceación en el ticket y enviar una foto de la nota"
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.ventaService.onCancelarVenta(venta.id, venta.sucursalId).pipe(untilDestroyed(this)).subscribe((res) => {
            if (res) {
              this.notificacionSnackBar.openSucess("Cancelado con éxito");
              venta.estado = VentaEstado.CANCELADA;
              this.dataSource.data = updateDataSource(this.dataSource.data, venta, index);
              this.reimpresionVenta(venta.id);
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
      }
    });
  }
}
