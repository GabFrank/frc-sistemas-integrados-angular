import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { Presentacion } from "../../presentacion/presentacion.model";
import { CodigoInput } from "../codigo-input.model";
import { Codigo } from "../codigo.model";
import { CodigoService } from "../codigo.service";

export class AdicionarCodigoData {
  codigo: Codigo;
  presentacion: Presentacion;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-adicionar-codigo-dialog",
  templateUrl: "./adicionar-codigo-dialog.component.html",
  styleUrls: ["./adicionar-codigo-dialog.component.scss"],
})
export class AdicionarCodigoDialogComponent implements OnInit {
  formGroup: FormGroup;
  selectedCodigo: Codigo;
  codigoControl = new FormControl(null, Validators.required);
  principalControl = new FormControl(null);
  activoControl = new FormControl(null);
  codigoInput = new CodigoInput;
  isEditting = false;
  isPesable = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarCodigoData,
    private matDialogRef: MatDialogRef<AdicionarCodigoDialogComponent>,
    private codigoService: CodigoService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private cargandoDialog: CargandoDialogService
  ) {}

  ngOnInit(): void {
    this.createForm();
    if(this.data?.presentacion?.producto?.balanza==true){
      this.codigoControl.setValidators([Validators.required, Validators.minLength(5), Validators.maxLength(5)])
      this.codigoControl.updateValueAndValidity()
      this.isPesable = true;
    }
    if (this.data?.codigo?.id != null) {
      this.cargarDato();
      this.formGroup.disable()
    } else {
      this.isEditting = true;
    }
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("codigo", this.codigoControl);
    this.formGroup.addControl("principal", this.principalControl);
    this.formGroup.addControl("activo", this.activoControl);

    //inicializando controles
    this.principalControl.setValue(false);
    this.activoControl.setValue(true);

  }

  cargarDato() {
    this.selectedCodigo = this.data.codigo;
    this.codigoControl.setValue(this.selectedCodigo.codigo);
    this.principalControl.setValue(this.selectedCodigo.principal);
    this.activoControl.setValue(this.selectedCodigo.activo);
    
    //cargar input
    this.codigoInput.id = this.selectedCodigo.id;
  }

  onSave() {
    this.cargandoDialog.openDialog()
    this.codigoInput.codigo = this.codigoControl.value;
    this.codigoInput.activo = this.activoControl.value;
    this.codigoInput.principal = this.principalControl.value;
    this.codigoInput.presentacionId = this.data.presentacion.id;
    //primero buscar si ya existe el codigo a guardar
    let isCodigoInUse = false;
    this.codigoService
      .onGetCodigoPorCodigo(this.codigoInput.codigo).pipe(untilDestroyed(this))
      .subscribe((res) => {
        console.log(res)
        this.cargandoDialog.closeDialog()
        if (res.errors == null) {
          switch (res.data.data.length) {
            case 0:
              isCodigoInUse = false;
              break;
            case 1:
              console.log(res.data.data[0].id, this.codigoInput.id)
              if (res.data.data[0].id === this.codigoInput.id) {
                isCodigoInUse = false;
              } else {
                isCodigoInUse = true;
              }
              break;
            default:
              isCodigoInUse = true;
              break;
          }

          if(isCodigoInUse){
            this.notificacionSnackBar.notification$.next({
              texto: 'El código ya está en uso',
              duracion: 3,
              color: NotificacionColor.danger
            })
          } else {
            this.codigoService.onSaveCodigo(this.codigoInput).pipe(untilDestroyed(this)).subscribe(res2 => {
              console.log(res2)
              if(res2!=null){
                this.matDialogRef.close(res2)
              }
            })
          }
        }
      });
  }

  onCancelar() {
    this.matDialogRef.close()
  }
}
