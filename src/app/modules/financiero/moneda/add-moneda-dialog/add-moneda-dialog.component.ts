import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Moneda } from '../moneda.model';
import { MonedaService } from '../moneda.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-moneda-dialog',
  templateUrl: './add-moneda-dialog.component.html',
  styleUrls: ['./add-moneda-dialog.component.scss']
})
export class AddMonedaDialogComponent implements OnInit {

  formGroup: FormGroup;
  denominacionControl = new FormControl('', Validators.required);
  simboloControl = new FormControl('', Validators.required);
  decimalesControl = new FormControl(0, [Validators.required, Validators.min(0), Validators.max(4)]);
  principalControl = new FormControl(false);
  activoControl = new FormControl(true);
  reglaRedondeoControl = new FormControl('NINGUNO');
  redondeoMultiploControl = new FormControl(null);

  reglaList = [
    { label: 'Ninguno', value: 'NINGUNO' },
    { label: 'Múltiplo', value: 'MULTIPLO' },
  ];

  isEditing = false;
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<AddMonedaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Moneda,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      denominacionControl: this.denominacionControl,
      simboloControl: this.simboloControl,
      decimalesControl: this.decimalesControl,
      principalControl: this.principalControl,
      activoControl: this.activoControl,
      reglaRedondeoControl: this.reglaRedondeoControl,
      redondeoMultiploControl: this.redondeoMultiploControl,
    });

    if (this.data != null) {
      this.isEditing = true;
      this.denominacionControl.setValue(this.data.denominacion);
      this.simboloControl.setValue(this.data.simbolo);
      this.decimalesControl.setValue(this.data.decimales ?? 0);
      this.principalControl.setValue(!!this.data.principal);
      this.activoControl.setValue(this.data.activo !== false);
      this.reglaRedondeoControl.setValue(this.data.reglaRedondeo || 'NINGUNO');
      this.redondeoMultiploControl.setValue(this.data.redondeoMultiplo);
    }
  }

  onSave() {
    if (this.formGroup.invalid) return;
    const moneda = new Moneda();
    if (this.isEditing) moneda.id = this.data.id;
    moneda.denominacion = this.denominacionControl.value?.toUpperCase();
    moneda.simbolo = this.simboloControl.value;
    moneda.decimales = this.decimalesControl.value;
    moneda.principal = this.principalControl.value;
    moneda.activo = this.activoControl.value;
    moneda.reglaRedondeo = this.reglaRedondeoControl.value;
    moneda.redondeoMultiplo = this.reglaRedondeoControl.value === 'MULTIPLO' ? this.redondeoMultiploControl.value : null;
    // Preservar pais/usuario si se está editando (no se editan aquí).
    if (this.isEditing) { moneda.pais = this.data.pais; moneda.usuario = this.data.usuario; }

    this.isSaving = true;
    this.monedaService.onSave(moneda).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res != null) {
          this.notificacion.openSucess('Moneda guardada correctamente');
          this.dialogRef.close(res);
        }
      },
      error: err => {
        this.isSaving = false;
        const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Error al guardar la moneda';
        this.notificacion.openWarn(msg, 6);
      }
    });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
