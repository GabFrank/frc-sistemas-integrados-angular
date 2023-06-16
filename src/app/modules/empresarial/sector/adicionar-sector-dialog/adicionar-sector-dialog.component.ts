import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from '../../sucursal/sucursal.model';
import { Sector } from '../sector.model';
import { SectorService } from '../sector.service';

export interface AdicionarSectorData {
  sucursal: Sucursal;
  sector: Sector;
}

@UntilDestroy()
@Component({
  selector: 'app-adicionar-sector-dialog',
  templateUrl: './adicionar-sector-dialog.component.html',
  styleUrls: ['./adicionar-sector-dialog.component.scss']
})
export class AdicionarSectorDialogComponent implements OnInit {

  selectedSector = new Sector;
  selectedSucursal: Sucursal;
  descripcionControl = new FormControl(null, Validators.required)
  activoControl = new FormControl(true)
  formGroup: FormGroup;
  isEditting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AdicionarSectorData,
    private dialogRef: MatDialogRef<AdicionarSectorDialogComponent>,
    private sectorService: SectorService
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      descripcion: this.descripcionControl,
      activo: this.activoControl
    })

    if (this.data.sucursal == null) {
      this.dialogRef.close(null)
    } else {
      this.selectedSucursal = this.data.sucursal;
    }
    if (this.data.sector != null) {
      Object.assign(this.selectedSector, this.data.sector)
      this.cargarDatos()
    } else {
      this.isEditting = true
    }
  }

  cargarDatos() {
    this.descripcionControl.setValue(this.selectedSector.descripcion)
    this.activoControl.setValue(this.selectedSector.activo)
    this.formGroup.disable()
  }

  onCancel() {
    this.dialogRef.close(null)
  }

  onSave() {
    this.selectedSector.descripcion = this.descripcionControl.value
    this.selectedSector.activo = this.activoControl.value
    this.selectedSector.sucursal = this.selectedSucursal;
    this.sectorService.onSaveSector(this.selectedSector.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dialogRef.close(res)
        }
      })
  }

}
