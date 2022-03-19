import { Component, Inject, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Product } from "electron/main";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { ProductoComponent } from "../../producto/edit-producto/producto.component";
import { Producto } from "../../producto/producto.model";
import { DialogData } from "../../producto/search-producto-dialog/search-producto-dialog.component";
import { TipoPresentacion } from "../../tipo-presentacion/tipo-presentacion.model";
import { TipoPresentacionService } from "../../tipo-presentacion/tipo-presentacion.service";
import { Presentacion } from "../presentacion.model";
import { PresentacionInput } from "../presentacion.model-input";
import { PresentacionService } from "../presentacion.service";

export class AdicionarPresentacionData {
  presentacion: Presentacion;
  producto: Producto;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-adicionar-presentacion",
  templateUrl: "./adicionar-presentacion.component.html",
  styleUrls: ["./adicionar-presentacion.component.scss"],
})
export class AdicionarPresentacionComponent implements OnInit {
  selectedProducto: Producto = new Producto();
  selectedPresentacion: Presentacion = new Presentacion();
  selectedTipoPresentacion: TipoPresentacion = new TipoPresentacion();
  presentacionInput: PresentacionInput = new PresentacionInput();
  tipoPresentacionList: TipoPresentacion[];
  //form group and form controls
  formGroup: FormGroup;
  descripcionControl = new FormControl(null, Validators.required);
  cantidadControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(true);
  principalControl = new FormControl(false);
  productoControl = new FormControl(null);
  tipoPresentacionControl = new FormControl(null, Validators.required);
  imagenPrincipalControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarPresentacionData,
    private matDialogRef: MatDialogRef<AdicionarPresentacionComponent>,
    private presentacionService: PresentacionService,
    private tipoPresentacionService: TipoPresentacionService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private cargandoDialog: CargandoDialogService
  ) {}

  ngOnInit(): void {
    //inicializando arrays
    this.tipoPresentacionList = [];

    this.selectedPresentacion = this.data.presentacion;
    this.selectedProducto = this.data.producto;

    this.createForm();
    this.createTipoPresentacionSelect();

    if (this.selectedPresentacion != null) {
      this.cargarPresentacion();
    }
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("descripcion", this.descripcionControl);
    this.formGroup.addControl("cantidad", this.cantidadControl);
    this.formGroup.addControl("activo", this.activoControl);
    this.formGroup.addControl("principal", this.principalControl);
    this.formGroup.addControl("producto", this.productoControl);
    this.formGroup.addControl("tipoPresentacion", this.tipoPresentacionControl);
    this.formGroup.addControl(
      "imagenPrincipalControl",
      this.imagenPrincipalControl
    );

    //inicializar valores en el form
    this.activoControl.setValue(true);
    this.principalControl.setValue(false);

    //cargar
  }

  onSave() {
    this.cargandoDialog.openDialog()
    if (this.selectedPresentacion != null) {
      this.presentacionInput.id = this.selectedPresentacion.id;
    }
    if(this.descripcionControl.value == ''){
      this.descripcionControl.setValue(null)
    }
    this.presentacionInput.descripcion = this.descripcionControl.value;
    this.presentacionInput.productoId = this.selectedProducto.id;
    this.presentacionInput.tipoPresentacionId =
      this.tipoPresentacionControl.value;
    this.presentacionInput.cantidad = this.cantidadControl.value;
    this.presentacionInput.activo = this.activoControl.value;
    this.presentacionInput.principal = this.principalControl.value;
    this.presentacionService
      .onSavePresentacion(this.presentacionInput).pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.cargandoDialog.closeDialog()
        if(res?.errors?.length>0){
          console.log(res)
          this.notificacionSnackBar.notification$.next({
            texto: res.errors[0]?.message,
            color: NotificacionColor.danger,
            duracion: 3
          })
        } else {
          this.notificacionSnackBar.notification$.next({
            texto: 'Presentación guardada con éxito',
            color: NotificacionColor.success,
            duracion: 2
          })
          setTimeout(() => {
            console.log(res.data.data)
            this.matDialogRef.close(res.data.data);
          }, 500);
        }

      });
  }

  onCancelar() {
    this.matDialogRef.close(null);
  }

  cargarPresentacion() {
    this.cargandoDialog.openDialog()
    console.log(this.selectedPresentacion);
    this.descripcionControl.setValue(this.selectedPresentacion.descripcion);
    this.principalControl.setValue(this.selectedPresentacion.principal);
    this.activoControl.setValue(this.selectedPresentacion.activo);
    this.cantidadControl.setValue(this.selectedPresentacion.cantidad);
    this.selectedTipoPresentacion = this.selectedPresentacion.tipoPresentacion;
    this.tipoPresentacionControl.setValue(this.selectedTipoPresentacion.id);
    this.cargandoDialog.closeDialog()
  }

  //tipo presentacion
  createTipoPresentacionSelect() {
    this.cargandoDialog.openDialog()
    this.tipoPresentacionService.onGetPresentaciones().pipe(untilDestroyed(this)).subscribe((res) => {
      console.log(res);
      this.tipoPresentacionList = res.data.data.sort((a, b) => {
        if (a.id > b.id) {
          return 1;
        } else {
          return -1;
        }
      });
      this.cargandoDialog.closeDialog()
    });
  }

  onTipoPresentacionSelect(e) {}

  //fin tipo presentacion
}
