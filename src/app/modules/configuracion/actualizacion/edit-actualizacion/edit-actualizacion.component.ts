import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ipAddress, port } from '../../../../../environments/conectionConfig';
import { Actualizacion, NivelActualizacion, TipoActualizacion } from '../actualizacion.model';
import { ActualizacionService } from '../actualizacion.service';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { MainService } from '../../../../main.service';

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
  title = new FormControl(null, [Validators.required])
  msg = new FormControl('Por favor actualize a la nueva versión del sistema para continuar utilizando', [Validators.required])
  sucursalControl = new FormControl(null, Validators.required); 
  sucursalList: Sucursal[] = []


  //url en donde subir el archivo
  url = `http://${ipAddress}:${port}/update/upload`

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ActualizacionData,
    private dialogRef: MatDialogRef<EditActualizacionComponent>,
    private actualizacionService: ActualizacionService,
    private sucursalService: SucursalService,
    private mainService: MainService
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
      'msg': this.msg,
      'sucursales': this.sucursalControl
    })

    this.sucursalService.onGetAllSucursales().subscribe(res => {
      this.sucursalList = res.filter(s => s.id != 0);
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
    let sucIdList = [];
    this.sucursalControl?.value?.forEach(s => {
      sucIdList.push(s.id)
    });
    this.selectedActualizacion.currentVersion = this.currentVersion.value
    this.selectedActualizacion.title = this.title.value
    if(this.selectedActualizacion?.usuario == null) this.selectedActualizacion.usuario = this.mainService.usuarioActual;
    this.actualizacionService.onSaveForSucursales(this.selectedActualizacion.toInput(), sucIdList)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dialogRef.close(res)
        }
      })
  }

}