import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { VentaItem } from '../../../../operaciones/venta/venta-item.model';
import { Venta } from '../../../../operaciones/venta/venta.model';
import { VentaService } from '../../../../operaciones/venta/venta.service';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatDialog } from '@angular/material/dialog';
import { EditCantidadEnvasesData, EditCantidadEnvasesDialogComponent } from './edit-cantidad-envases-dialog/edit-cantidad-envases-dialog.component';
import { updateDataSource } from '../../../../../commons/core/utils/numbersUtils';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-garantia-dialog',
  templateUrl: './garantia-dialog.component.html',
  styleUrls: ['./garantia-dialog.component.scss']
})
export class GarantiaDialogComponent implements OnInit {

  ventaIdControl = new FormControl(null, Validators.required)
  selectedVenta: Venta;
  isLoading = false;
  ventaItemList: VentaItem[]
  dataSource = new MatTableDataSource<VentaItem>([])
  addedDataSource = new MatTableDataSource<VentaItem>([])
  displayedColumns = ['id', 'descripcion', 'cantidad', 'precio', 'total', 'acciones']
  addedDisplayedColumns = ['id', 'descripcion', 'cantidad', 'precio', 'total', 'acciones']

  constructor(
    private ventaService: VentaService,
    private cargandoService: CargandoDialogService,
    private notificacion: NotificacionSnackbarService,
    private matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.ventaItemList = []
  }

  onBuscarCodigo() {
    this.cargandoService.openDialog(false, "Buscando venta")
    this.ventaService.onGetPorId(this.ventaIdControl.value).pipe(untilDestroyed(this)).subscribe(res => {
      this.cargandoService.closeDialog()
      if (res != null) {
        this.ventaItemList = res.ventaItemList.filter(i => i.producto.isEnvase == true)
        this.dataSource.data = this.ventaItemList;
        if (this.ventaItemList.length == 0) {
          this.notificacion.notification$.next({
            texto: 'Esta venta no contiene envases',
            color: NotificacionColor.warn,
            duracion: 2
          })
        }
      } else {
        this.notificacion.notification$.next({
          texto: 'No existe venta con éste código',
          color: NotificacionColor.warn,
          duracion: 2
        })
      }
    })
  }

  onAdd(e: VentaItem, index) {
    let cantidad = e.cantidad;
    this.matDialog.open(EditCantidadEnvasesDialogComponent, { data: { cantidad: e.cantidad } }).afterClosed().subscribe(res => {
      if (res != null) e.cantidad = res;
      this.addItem(e)
      if(e.cantidad != cantidad){
        e.cantidad = e.cantidad - cantidad;
        this.dataSource.data = updateDataSource(this.dataSource.data, e, index)
      }
    })

  }

  addItem(e: VentaItem) {
    this.addedDataSource.data = updateDataSource(this.addedDataSource.data, e)
  }

  onDelete(index) {
    this.addedDataSource.data = updateDataSource(this.addedDataSource.data, null, index)
  }

  onFinalizar() {

  }

}
