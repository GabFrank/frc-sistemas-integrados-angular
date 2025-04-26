import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';

export interface FinancieroConfiguracionData {
  paginacionTamano: number;
  mostrarMonedas: boolean;
  mostrarAccesosRapidos: boolean;
}

@UntilDestroy()
@Component({
  selector: 'financiero-configuracion-dialog',
  templateUrl: './financiero-configuracion-dialog.component.html',
  styleUrls: ['./financiero-configuracion-dialog.component.scss']
})
export class FinancieroConfiguracionDialogComponent implements OnInit {
  configuracionForm: FormGroup;
  
  tamanosPagina = [5, 10, 20, 50, 100];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FinancieroConfiguracionDialogComponent>,
    private notificacionService: NotificacionSnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: FinancieroConfiguracionData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.configuracionForm = this.fb.group({
      paginacionTamano: [this.data?.paginacionTamano || 10],
      mostrarMonedas: [this.data?.mostrarMonedas !== undefined ? this.data.mostrarMonedas : true],
      mostrarAccesosRapidos: [this.data?.mostrarAccesosRapidos !== undefined ? this.data.mostrarAccesosRapidos : true]
    });
  }

  guardarConfiguracion(): void {
    if (this.configuracionForm.valid) {
      this.dialogRef.close(this.configuracionForm.value);
      this.notificacionService.openSucess('CONFIGURACIÓN GUARDADA CORRECTAMENTE');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
