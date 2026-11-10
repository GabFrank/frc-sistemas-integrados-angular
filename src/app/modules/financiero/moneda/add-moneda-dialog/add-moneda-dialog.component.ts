import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Moneda } from '../moneda.model';
import { MonedaService } from '../moneda.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

export interface AddMonedaDialogData {
  /** null = moneda nueva. */
  moneda: Moneda | null;
  /** El central conoce `codigoIso`: solo entonces se muestra y se envía. */
  soportaCodigoIso: boolean;
}

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
  /**
   * Solo lectura: el central ignora `principal` al guardar. La moneda de la empresa se cambia con el
   * procedimiento de corte, no desde el ABM.
   */
  principalControl = new FormControl({ value: false, disabled: true });
  codigoIsoControl = new FormControl('', [Validators.pattern(/^[A-Za-z]{3}$/)]);
  activoControl = new FormControl(true);
  reglaRedondeoControl = new FormControl('NINGUNO');
  redondeoMultiploControl = new FormControl(null);

  reglaList = [
    { label: 'Ninguno', value: 'NINGUNO' },
    { label: 'Múltiplo', value: 'MULTIPLO' },
  ];

  isEditing = false;
  isSaving = false;
  soportaCodigoIso = false;
  private moneda: Moneda | null = null;

  constructor(
    private dialogRef: MatDialogRef<AddMonedaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddMonedaDialogData,
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
      codigoIsoControl: this.codigoIsoControl,
    });

    this.moneda = this.data?.moneda ?? null;
    this.soportaCodigoIso = this.data?.soportaCodigoIso === true;
    if (this.moneda != null) {
      this.isEditing = true;
      this.denominacionControl.setValue(this.moneda.denominacion);
      this.simboloControl.setValue(this.moneda.simbolo);
      this.decimalesControl.setValue(this.moneda.decimales ?? 0);
      this.principalControl.setValue(!!this.moneda.principal);
      this.activoControl.setValue(this.moneda.activo !== false);
      this.reglaRedondeoControl.setValue(this.moneda.reglaRedondeo || 'NINGUNO');
      this.redondeoMultiploControl.setValue(this.moneda.redondeoMultiplo);
      this.codigoIsoControl.setValue(this.moneda.codigoIso || '');
    }
  }

  onSave() {
    if (this.formGroup.invalid) return;
    const moneda = new Moneda();
    if (this.isEditing) moneda.id = this.moneda.id;
    moneda.denominacion = this.denominacionControl.value?.toUpperCase();
    moneda.simbolo = this.simboloControl.value;
    moneda.decimales = this.decimalesControl.value;
    // El central conserva la guardada; se manda la misma para no sugerir un cambio.
    moneda.principal = this.isEditing ? !!this.moneda.principal : false;
    // Solo contra un central que lo conoce; `''` lo borra. Sin soporte queda undefined y no viaja.
    if (this.soportaCodigoIso) {
      moneda.codigoIso = (this.codigoIsoControl.value || '').trim().toUpperCase();
    }
    moneda.activo = this.activoControl.value;
    moneda.reglaRedondeo = this.reglaRedondeoControl.value;
    moneda.redondeoMultiplo = this.reglaRedondeoControl.value === 'MULTIPLO' ? this.redondeoMultiploControl.value : null;
    // Preservar pais/usuario si se está editando (no se editan aquí).
    if (this.isEditing) { moneda.pais = this.moneda.pais; moneda.usuario = this.moneda.usuario; }

    this.isSaving = true;
    // El aviso de éxito es propio (más específico); el de error lo da onSaveCustom.
    this.monedaService.onSave(moneda, { avisarExito: false }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res != null) {
          this.notificacion.openSucess('Moneda guardada correctamente');
          this.dialogRef.close(res);
        }
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
