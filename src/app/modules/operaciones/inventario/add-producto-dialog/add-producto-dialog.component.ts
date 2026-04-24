import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Inventario, InventarioProducto, InventarioProductoEstado, InventarioProductoItem } from '../inventario.model';
import { InventarioService } from '../inventario.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PdvSearchProductoData, PdvSearchProductoDialogComponent, PdvSearchProductoResponseData } from '../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { Presentacion } from '../../../productos/presentacion/presentacion.model';
import { MainService } from '../../../../main.service';

export interface AddProductoDialogData {
  inventarioProducto: InventarioProducto;
  inventario: Inventario;
}

@UntilDestroy()
@Component({
  selector: 'app-add-producto-dialog',
  templateUrl: './add-producto-dialog.component.html',
  styleUrls: ['./add-producto-dialog.component.scss']
})
export class AddProductoDialogComponent implements OnInit {

  formGroup: FormGroup;
  presentacionSeleccionada: Presentacion;
  estadosDisponibles = Object.values(InventarioProductoEstado);
  productoDisplayText: string = '';

  constructor(
    public dialogRef: MatDialogRef<AddProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddProductoDialogData,
    private inventarioService: InventarioService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private mainService: MainService
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  private inicializarFormulario() {
    this.formGroup = new FormGroup({
      presentacion: new FormControl(null, Validators.required),
      cantidad: new FormControl(null, [Validators.required, Validators.min(0.01)]),
      vencimiento: new FormControl(null),
      estado: new FormControl(InventarioProductoEstado.BUENO, Validators.required)
    });
  }

  onBuscarProducto() {
    const data: PdvSearchProductoData = {
      conservarUltimaBusqueda: true,
      mostrarStock: true,
      mostrarOpciones: false,
      costo: false
    };

    const dialogRef = this.matDialog.open(PdvSearchProductoDialogComponent, {
      width: '90%',
      height: '90%',
      data: data
    });

    dialogRef.afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: PdvSearchProductoResponseData) => {
        if (res?.presentacion) {
          this.presentacionSeleccionada = res.presentacion;
          this.formGroup.get('presentacion').setValue(res.presentacion);
          this.actualizarDisplayText();
        }
      });
  }

  private actualizarDisplayText() {
    if (this.presentacionSeleccionada?.producto) {
      this.productoDisplayText = this.presentacionSeleccionada.producto.descripcion;
    } else {
      this.productoDisplayText = '';
    }
  }

  onGuardar() {
    if (this.formGroup.invalid) {
      this.notificacionService.openWarn('Complete todos los campos requeridos');
      return;
    }

    const item = new InventarioProductoItem();
    item.inventarioProducto = this.data.inventarioProducto;
    item.zona = this.data.inventarioProducto.zona;
    item.sector = this.data.inventarioProducto.zona?.sector;
    item.presentacion = this.presentacionSeleccionada;
    item.cantidad = this.formGroup.get('cantidad').value;
    item.cantidadFisica = this.formGroup.get('cantidad').value; // Usar la misma cantidad
    item.vencimiento = this.formGroup.get('vencimiento').value;
    item.estado = this.formGroup.get('estado').value;
    item.usuario = this.mainService.usuarioActual;

    const input = item.toInput();

    this.inventarioService.onSaveInventarioProductoItem(input)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.notificacionService.openSucess('Producto agregado correctamente');
          this.dialogRef.close(res);
        }
      });
  }

  onCancelar() {
    this.dialogRef.close(false);
  }

  limpiarProducto() {
    this.presentacionSeleccionada = null;
    this.formGroup.get('presentacion').setValue(null);
    this.productoDisplayText = '';
  }

}
