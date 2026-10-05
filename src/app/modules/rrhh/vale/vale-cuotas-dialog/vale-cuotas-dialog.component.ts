import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Vale, ValeCuota } from '../vale.model';
import { ValeService } from '../vale.service';

export interface ValeCuotasDialogData {
  vale: Vale;
}

/** Las cuotas de un vale y en qué liquidación se descontó cada una. */
@UntilDestroy()
@Component({
  selector: 'app-vale-cuotas-dialog',
  templateUrl: './vale-cuotas-dialog.component.html',
  styleUrls: ['./vale-cuotas-dialog.component.scss']
})
export class ValeCuotasDialogComponent implements OnInit {

  vale: Vale;
  cuotas: ValeCuota[] = [];
  columnas = ['numero', 'fechaDescuento', 'monto', 'estado', 'documento'];
  cargando = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: ValeCuotasDialogData,
    private dialogRef: MatDialogRef<ValeCuotasDialogComponent>,
    private valeService: ValeService
  ) {
    this.vale = data.vale;
  }

  ngOnInit(): void {
    this.valeService.onGetCuotas(this.vale.id).pipe(untilDestroyed(this)).subscribe({
      next: (res: ValeCuota[]) => {
        this.cuotas = res || [];
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  onCerrar() {
    this.dialogRef.close();
  }
}
