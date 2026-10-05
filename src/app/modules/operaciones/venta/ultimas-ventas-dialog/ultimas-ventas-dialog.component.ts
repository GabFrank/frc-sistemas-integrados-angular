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
import { ErrorCancelacionVenta, VentaService } from "../venta.service";
import { VentaTarjetaService } from "../../../financiero/venta-tarjeta/venta-tarjeta.service";
import { mensajeDeError } from "../../../financiero/venta-tarjeta/qr-pos/mensaje-error";

class UltimasVentasDialogData {
  caja: PdvCaja;
  cancelacion?: boolean;
  reimpresion: boolean;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { catchError, map, merge, startWith, switchMap, Observable, of as observableOf } from "rxjs";
import { VentaEstado } from "../enums/venta-estado.enums";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { PageInfo } from "../../../../app.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-ultimas-ventas-dialog",
  templateUrl: "./ultimas-ventas-dialog.component.html",
  styleUrls: ["./ultimas-ventas-dialog.component.scss"],
})
export class UltimasVentasDialogComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<Venta>([]);
  selectedVenta: Venta;
  codigoVentaControl = new FormControl();
  titulo = "";
  isLoading = false;
  selectedPageInfo: PageInfo<Venta>;

  // Pagination properties
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 15, 25, 50];

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
    private dialogService: DialogosService,
    private ventaTarjetaService: VentaTarjetaService
  ) {
    if (data?.cancelacion == true) {
      this.titulo = "CANCELAR VENTA";
    } else if (data?.reimpresion == true) {
      this.titulo = "REIMPRESIÓN DE TICKET";
    }
  }

  ngOnInit(): void {
    this.cargarVentas();
  }

  cargarVentas() {
    this.isLoading = true;
    this.ventaService
      .onSearch(null, this.data.caja.id, this.pageIndex, this.pageSize, false, this.data.caja.sucursalId, null, null, null, null, false, false, false).pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.isLoading = false;
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent;
        }
      });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarVentas();
  }

  onBuscarPorCodigo() {
    if (this.codigoVentaControl.value != null) {
      this.ventaService
        .onGetPorId(this.codigoVentaControl.value, null, null, false).pipe(untilDestroyed(this))
        .subscribe((res) => {
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

  /**
   * Cancela la venta en el CENTRAL, que es donde se recorre toda la cadena: caja, stock, delivery,
   * credito, factura y venta con tarjeta. La replica la baja a esta sucursal.
   *
   * Hasta el 2026-09-28 esto iba al filial (`servidor=false`), cuyo `cancelarVenta` era un stub que
   * devolvia true sin hacer nada: el cajero veia "Cancelado con exito" y la venta seguia igual.
   *
   * El central ALTERNA (una venta cancelada se reactiva), y esta pantalla solo ofrece cancelar: por
   * eso una venta ya cancelada no se manda.
   */
  cancelarVenta(venta: Venta, index) {
    if (venta?.estado == VentaEstado.CANCELADA) {
      this.notificacionSnackBar.openWarn("La venta " + venta.id + " ya está cancelada.");
      return;
    }
    this.dialogService
      .confirm(
        "ATENCIÓN!!",
        "Realmente desea cancelar la venta " + venta.id + "?",
        "Al cancelar una venta debe escribir el motivo de cancelación en el ticket y enviar una foto de la nota"
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          // La fila viene del filial, que puede ir atrasado: se relee del central y, si ya está cancelada, no se
          // manda (el central ALTERNA y la reactivaría) (#390)
          this.ventaService.onCancelarVentaVerificando(venta.id, venta.sucursalId, { soloCancelar: true }).pipe(untilDestroyed(this)).subscribe({
            next: (resultado) => {
              if (resultado.tipo === "cambio") {
                venta.estado = VentaEstado.CANCELADA;
                this.dataSource.data = updateDataSource(this.dataSource.data, venta, index);
                this.notificacionSnackBar.openWarn("La venta " + venta.id + " ya estaba cancelada en el servidor: no se envió nada.", 6);
                return;
              }
              const res = resultado.tipo === "aplicada";
              if (!res) {
                this.notificacionSnackBar.openAlgoSalioMal("No se pudo cancelar la venta " + venta.id + ".");
                return;
              }
              this.notificacionSnackBar.openSucess("Cancelado con éxito");
              venta.estado = VentaEstado.CANCELADA;
              this.dataSource.data = updateDataSource(this.dataSource.data, venta, index);
              // Respaldo: el central ya la cancela, pero si alguna vez se revierte el central por
              // debajo de este cambio, esto sigue cancelando la venta con tarjeta en la sucursal.
              // Las dos escriben CANCELADO: repetirlo no cambia nada.
              this.ventaTarjetaService.onCancelarPorVentaId(venta.id, venta.sucursalId).subscribe({
                error: (err) => console.error('[VentaTarjeta] no se pudo cancelar el registro de tarjeta:', err),
              });
              this.reimpresionVenta(venta.id);
            },
            // Antes no habia handler: si fallaba, el cajero no veia ni exito ni error.
            error: (err: ErrorCancelacionVenta) => {
              if (err?.fase === "lectura") {
                this.notificacionSnackBar.openWarn(
                  "No se pudo verificar la venta " + venta.id + " en el servidor central: no se envió nada. Intentá de nuevo.", 6);
                return;
              }
              // Sin respuesta pudo haberse cancelado. Reintentar es seguro: se relee antes y no se reactiva.
              this.notificacionSnackBar.openAlgoSalioMal(
                mensajeDeError(err?.error, "No se pudo confirmar si la venta " + venta.id + " se canceló. Revisá la conexión con el servidor central y volvé a intentar."));
            },
          });
        }
      });
  }

  reimpresionVenta(id) {
    this.ventaService.onReimprimirVenta(id, false).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.notificacionSnackBar.openSucess("Reimpreso con éxito");
      }
    });
  }

  salir() {
    this.matDialogRef.close();
  }
}
