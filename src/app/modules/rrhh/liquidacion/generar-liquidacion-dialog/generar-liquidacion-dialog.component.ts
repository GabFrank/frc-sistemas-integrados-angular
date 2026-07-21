import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { LiquidacionService } from '../liquidacion.service';


export interface GenerarLiquidacionDialogData {
  funcionarioId: number;
  periodo: string;
}

@UntilDestroy()
@Component({
  selector: 'app-generar-liquidacion-dialog',
  templateUrl: './generar-liquidacion-dialog.component.html',
  styleUrls: ['./generar-liquidacion-dialog.component.scss']
})
export class GenerarLiquidacionDialogComponent implements OnInit {

  formGroup: FormGroup;
  monedas: Moneda[] = [];

  funcionarioControl = new FormControl(null, [Validators.required]);
  periodoControl = new FormControl(null, [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]);
  monedaControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: GenerarLiquidacionDialogData,
    private dialogRef: MatDialogRef<GenerarLiquidacionDialogComponent>,
    private liquidacionService: LiquidacionService,
    private monedaService: MonedaService
  ) {
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      funcionario: this.funcionarioControl,
      periodo: this.periodoControl,
      moneda: this.monedaControl
    });
    if (this.data?.funcionarioId != null) this.funcionarioControl.setValue(this.data.funcionarioId);
    if (this.data?.periodo) this.periodoControl.setValue(this.data.periodo);
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe((res: Moneda[]) => {
      this.monedas = res || [];
      const g = this.monedas.find(m => m.denominacion && m.denominacion.toUpperCase().includes('GUARANI'));
      if (g) this.monedaControl.setValue(g.id);
    });
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGenerar() {
    if (this.formGroup.invalid) { return; }
    this.liquidacionService.onGenerarBorrador(this.funcionarioControl.value, this.periodoControl.value, this.monedaControl.value)
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
