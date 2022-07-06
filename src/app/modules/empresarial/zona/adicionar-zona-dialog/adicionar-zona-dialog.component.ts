import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sector } from '../../sector/sector.model';
import { Zona } from '../zona.model';
import { ZonaService } from '../zona.service';

export interface AdicionarZonaData {
  sector: Sector;
  zona: Zona;
}

@UntilDestroy()
@Component({
  selector: 'app-adicionar-zona-dialog',
  templateUrl: './adicionar-zona-dialog.component.html',
  styleUrls: ['./adicionar-zona-dialog.component.scss']
})
export class AdicionarZonaDialogComponent implements OnInit {
  selectedZona = new Zona;
  selectedSector: Sector;
  descripcionControl = new FormControl(null, Validators.required)
  activoControl = new FormControl(true)
  formGroup: FormGroup;
  isEditting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AdicionarZonaData,
    private dialogRef: MatDialogRef<AdicionarZonaDialogComponent>,
    private zonaService: ZonaService
  ) { }

  ngOnInit(): void {

    this.formGroup = new FormGroup({
      descripcion: this.descripcionControl,
      activo: this.activoControl
    })

    if (this.data.sector == null) {
      this.dialogRef.close(null)
    } else {
      this.selectedSector = this.data.sector;
    }
    if (this.data.zona != null) {
      Object.assign(this.selectedZona, this.data.zona)
      this.cargarDatos()
    } else {
      this.isEditting = true;
    }
  }

  cargarDatos() {
    this.descripcionControl.setValue(this.selectedZona.descripcion)
    this.activoControl.setValue(this.selectedSector.activo)
    this.formGroup.disable()
  }

  onEdit() {
    this.isEditting = true;
    this.formGroup.enable()
  }

  onCancel() {
    this.dialogRef.close(null)
  }

  onSave() {
    this.selectedZona.descripcion = this.descripcionControl.value
    this.selectedZona.activo = this.activoControl.value
    this.selectedZona.sector = this.selectedSector;
    this.zonaService.onSaveZona(this.selectedZona.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dialogRef.close(res)
        }
      })
  }

}
