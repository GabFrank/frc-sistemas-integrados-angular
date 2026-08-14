import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { ConfiguracionRrhh, ConfiguracionRrhhTipo } from '../configuracion-rrhh.model';
import { ConfiguracionRrhhService } from '../configuracion-rrhh.service';

export interface ConfiguracionRrhhDialogData {
  configuracion: ConfiguracionRrhh;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-configuracion-rrhh-dialog',
  templateUrl: './edit-configuracion-rrhh-dialog.component.html',
  styleUrls: ['./edit-configuracion-rrhh-dialog.component.scss']
})
export class EditConfiguracionRrhhDialogComponent implements OnInit {

  selectedConfiguracion: ConfiguracionRrhh;
  formGroup: FormGroup;
  isEditting = false;

  tipoOptions: ConfiguracionRrhhTipo[] = ['NUMBER', 'STRING', 'BOOLEAN', 'DATE'];

  claveControl = new FormControl(null, [Validators.required]);
  valorControl = new FormControl(null);
  tipoControl = new FormControl('STRING', [Validators.required]);
  descripcionControl = new FormControl(null);
  activoControl = new FormControl(true);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ConfiguracionRrhhDialogData,
    private dialogRef: MatDialogRef<EditConfiguracionRrhhDialogComponent>,
    private configuracionRrhhService: ConfiguracionRrhhService,
    private mainService: MainService
  ) {
    if (data?.configuracion != null) {
      this.selectedConfiguracion = data.configuracion;
    } else {
      this.selectedConfiguracion = new ConfiguracionRrhh();
    }
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      clave: this.claveControl,
      valor: this.valorControl,
      tipo: this.tipoControl,
      descripcion: this.descripcionControl,
      activo: this.activoControl
    });

    if (this.selectedConfiguracion.id) {
      this.cargarDatos();
    } else {
      this.isEditting = true;
    }
  }

  cargarDatos() {
    this.claveControl.setValue(this.selectedConfiguracion.clave);
    this.valorControl.setValue(this.selectedConfiguracion.valor);
    this.tipoControl.setValue(this.selectedConfiguracion.tipo ?? 'STRING');
    this.descripcionControl.setValue(this.selectedConfiguracion.descripcion);
    this.activoControl.setValue(this.selectedConfiguracion.activo ?? true);
    this.formGroup.disable();
  }

  onHabilitarEdicion() {
    this.isEditting = true;
    this.formGroup.enable();
    // La clave no se edita en configuraciones existentes (es la llave logica)
    this.claveControl.disable();
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) {
      return;
    }

    this.selectedConfiguracion.clave = this.claveControl.value?.toUpperCase();
    this.selectedConfiguracion.valor = this.valorControl.value;
    this.selectedConfiguracion.tipo = this.tipoControl.value as ConfiguracionRrhhTipo;
    this.selectedConfiguracion.descripcion = this.descripcionControl.value?.toUpperCase();
    this.selectedConfiguracion.activo = this.activoControl.value ?? true;
    this.selectedConfiguracion.usuario = this.mainService.usuarioActual;

    const aux = new ConfiguracionRrhh();
    Object.assign(aux, this.selectedConfiguracion);

    this.configuracionRrhhService.onSave(aux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dialogRef.close(res);
        }
      });
  }
}
