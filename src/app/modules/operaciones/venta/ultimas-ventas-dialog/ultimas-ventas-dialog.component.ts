import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
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

  dataSource: Venta[] = [];
  selectedVenta: Venta;
  codigoVentaControl = new FormControl();
  titulo = "";
  isLoading = false;
  selectedPageInfo: PageInfo<Venta>;
  isSearchMode = false; // Para controlar si estamos en modo búsqueda por código

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
    this.cargandoService.openDialog();
    this.ventaService
      .onSearch(null, this.data.caja.id, this.pageIndex, this.pageSize, false, this.data.caja.sucursalId, null, null, null, null, false).pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.isLoading = false;
        this.cargandoService.closeDialog();
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource = [...res.getContent];
        }
      });
  }

  handlePageEvent(e: PageEvent) {
    // No permitir paginación en modo búsqueda
    if (this.isSearchMode) {
      return;
    }
    
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarVentas();
  }

  onBuscarPorCodigo() {
    if (this.codigoVentaControl.value != null) {
      this.isSearchMode = true; // Activar modo búsqueda
      this.cargandoService.openDialog();
      this.ventaService
        .onGetPorId(this.codigoVentaControl.value, null, null, false).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog();
          if (res != null) {
            this.dataSource = [res];
            // Crear un PageInfo ficticio para un solo elemento
            this.selectedPageInfo = {
              getContent: [res],
              getTotalElements: 1,
              getTotalPages: 1,
              getNumberOfElements: 1,
              isFirst: true,
              isLast: true
            } as PageInfo<Venta>;
          } else {
            this.dataSource = [];
            this.selectedPageInfo = null;
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
        "ATENCIÓN!!",
        "Realmente desea cancelar la venta " + venta.id + "?",
        "Al cancelar una venta debe escribir el motivo de canceación en el ticket y enviar una foto de la nota"
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.cargandoService.openDialog();
          this.ventaService.onCancelarVenta(venta.id, venta.sucursalId, false).pipe(untilDestroyed(this)).subscribe((res) => {
            this.cargandoService.closeDialog();
            if (res) {
              this.notificacionSnackBar.openSucess("Cancelado con éxito");
              venta.estado = VentaEstado.CANCELADA;
              this.dataSource = updateDataSource(this.dataSource, venta, index);
              this.reimpresionVenta(venta.id);
            }
          });
        }
      });
  }

  reimpresionVenta(id) {
    this.cargandoService.openDialog();
    this.ventaService.onReimprimirVenta(id, false).pipe(untilDestroyed(this)).subscribe((res) => {
      this.cargandoService.closeDialog();
      if (res != null) {
        this.notificacionSnackBar.openSucess("Reimpreso con éxito");
      }
    });
  }

  onLimpiarFiltro() {
    this.isSearchMode = false;
    this.codigoVentaControl.setValue(null);
    this.pageIndex = 0;
    this.cargarVentas();
  }

  salir() {
    this.matDialogRef.close();
  }
}
