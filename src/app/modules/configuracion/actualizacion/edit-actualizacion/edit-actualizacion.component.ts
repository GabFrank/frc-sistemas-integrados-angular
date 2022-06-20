import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ipAddress, port } from '../../../../../environments/conectionConfig';
import { Actualizacion, NivelActualizacion, TipoActualizacion } from '../actualizacion.model';
import { ActualizacionService } from '../actualizacion.service';

export interface ActualizacionData {
  actualizacion: Actualizacion
}

@UntilDestroy()
@Component({
  selector: 'app-edit-actualizacion',
  templateUrl: './edit-actualizacion.component.html',
  styleUrls: ['./edit-actualizacion.component.scss']
})
export class EditActualizacionComponent implements OnInit {

  selectedActualizacion: Actualizacion;
  tipoActualizacionList = Object.values(TipoActualizacion)
  nivelActualizacionList = Object.values(NivelActualizacion)
  formGroup: FormGroup

  currentVersion = new FormControl(null, [Validators.required])
  enabled = new FormControl(true)
  nivel = new FormControl(NivelActualizacion.CRITICO, [Validators.required])
  tipo = new FormControl(TipoActualizacion.DESKTOP, [Validators.required])
  title = new FormControl('Atención!! Actualización importante', [Validators.required])
  msg = new FormControl('Por favor actualize a la nueva versión del sistema para continuar utilizando', [Validators.required])
  
  //url en donde subir el archivo
  url = `http://${ipAddress}:${port}/update/upload`

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ActualizacionData,
    private dialogRef: MatDialogRef<EditActualizacionComponent>,
    private actualizacionService: ActualizacionService,

  ) {
    if (data?.actualizacion != null) {
      this.selectedActualizacion = data.actualizacion;
    } else {
      this.selectedActualizacion = new Actualizacion()
    }
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      'currentVersion': this.currentVersion,
      'nivel': this.nivel,
      'tipo': this.tipo,
      'title': this.title,
      'msg': this.msg
    })
  }

  cargarDatos() {
    if (this.selectedActualizacion?.id != null) {
      this.currentVersion.setValue(this.selectedActualizacion.currentVersion)
      this.nivel.setValue(this.selectedActualizacion.nivel)
      this.tipo.setValue(this.selectedActualizacion.tipo)
      this.title.setValue(this.selectedActualizacion.title)
      this.msg.setValue(this.selectedActualizacion.msg)
      this.enabled.setValue(this.selectedActualizacion.enabled)
    }
  }

  onCancelar() {
    this.dialogRef.close(null)
  }
  onGuardar() {
    this.selectedActualizacion.currentVersion = this.currentVersion.value
    this.selectedActualizacion.nivel = this.nivel.value
    this.selectedActualizacion.tipo = this.tipo.value
    this.selectedActualizacion.title = this.title.value
    this.selectedActualizacion.msg = this.msg.value
    this.selectedActualizacion.enabled = this.enabled.value
    switch (this.selectedActualizacion.nivel) {
      case NivelActualizacion.CRITICO:
        this.selectedActualizacion.btn = 'Descargar'
        break;
      case NivelActualizacion.MANTENIMIENTO:
      case NivelActualizacion.MODERADO:
        this.selectedActualizacion.btn = 'Aceptar'
        break;
    }
    this.actualizacionService.onSave(this.selectedActualizacion.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dialogRef.close(res)
        }
      })
  }

}
