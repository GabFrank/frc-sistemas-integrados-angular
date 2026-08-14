import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Chequera, ChequeraInput, EstadoChequera } from '../chequera.model';
import { ChequeraService } from '../chequera.service';
import { CuentaBancaria } from '../../cuenta-bancaria/cuenta-bancaria.model';
import { CuentaBancariaService } from '../../cuenta-bancaria/cuenta-bancaria.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { MainService } from '../../../../main.service';

export interface EditChequeraData { chequera?: Chequera; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-edit-chequera-dialog',
  templateUrl: './edit-chequera-dialog.component.html',
  styleUrls: ['./edit-chequera-dialog.component.scss'],
})
export class EditChequeraDialogComponent implements OnInit {

  formGroup: FormGroup;
  cuentaControl = new FormControl(null, Validators.required);
  nombreControl = new FormControl('');
  firmantesControl = new FormControl('');
  rangoDesdeControl = new FormControl(null, [Validators.required, Validators.min(0)]);
  rangoHastaControl = new FormControl(null, [Validators.required, Validators.min(0)]);
  siguienteControl = new FormControl(null, [Validators.min(0)]);
  estadoControl = new FormControl(EstadoChequera.ACTIVA, Validators.required);

  cuentas: CuentaBancaria[] = [];
  estados = [
    { label: 'Activa', value: EstadoChequera.ACTIVA },
    { label: 'Agotada', value: EstadoChequera.AGOTADA },
    { label: 'Anulada', value: EstadoChequera.ANULADA },
  ];

  esEdicion = false;
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<EditChequeraDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditChequeraData,
    private chequeraService: ChequeraService,
    private cuentaBancariaService: CuentaBancariaService,
    private notificacion: NotificacionSnackbarService,
    public mainService: MainService,
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      cuentaControl: this.cuentaControl,
      nombreControl: this.nombreControl,
      firmantesControl: this.firmantesControl,
      rangoDesdeControl: this.rangoDesdeControl,
      rangoHastaControl: this.rangoHastaControl,
      siguienteControl: this.siguienteControl,
      estadoControl: this.estadoControl,
    });

    this.cuentaBancariaService.onGetAllOperables().pipe(untilDestroyed(this)).subscribe(res => {
      this.cuentas = res || [];
      const ch = this.data?.chequera;
      if (ch?.cuentaBancaria?.id) {
        const sel = this.cuentas.find(c => c.id === ch.cuentaBancaria.id);
        if (sel) this.cuentaControl.setValue(sel);
      }
    });

    const ch = this.data?.chequera;
    if (ch) {
      this.esEdicion = true;
      this.nombreControl.setValue(ch.nombre || '');
      this.firmantesControl.setValue(ch.firmantes || '');
      this.rangoDesdeControl.setValue(ch.rangoDesde);
      this.rangoHastaControl.setValue(ch.rangoHasta);
      this.siguienteControl.setValue(ch.siguienteNumero);
      this.estadoControl.setValue(ch.estado || EstadoChequera.ACTIVA);
    }
  }

  onSave() {
    if (this.formGroup.invalid) {
      this.notificacion.openAlgoSalioMal('Complete los campos obligatorios');
      return;
    }
    const desde = this.rangoDesdeControl.value;
    const hasta = this.rangoHastaControl.value;
    if (hasta < desde) {
      this.notificacion.openAlgoSalioMal('El rango "hasta" no puede ser menor que "desde"');
      return;
    }

    const input: ChequeraInput = {
      id: this.data?.chequera?.id,
      cuentaBancariaId: (this.cuentaControl.value as CuentaBancaria)?.id,
      nombre: this.nombreControl.value ? String(this.nombreControl.value).toUpperCase() : null,
      firmantes: this.firmantesControl.value ? String(this.firmantesControl.value).toUpperCase() : null,
      rangoDesde: desde,
      rangoHasta: hasta,
      // Si no se indica el siguiente número, arranca desde el inicio del rango.
      siguienteNumero: this.siguienteControl.value != null ? this.siguienteControl.value : desde,
      estado: this.estadoControl.value,
      usuarioId: this.mainService.usuarioActual?.id,
    };

    this.isSaving = true;
    this.chequeraService.onSaveChequera(input).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res != null) {
          this.notificacion.openSucess(this.esEdicion ? 'Chequera actualizada' : 'Chequera creada');
          this.dialogRef.close(true);
        }
      },
      error: err => {
        this.isSaving = false;
        const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo guardar la chequera';
        this.notificacion.openAlgoSalioMal(msg);
      },
    });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
