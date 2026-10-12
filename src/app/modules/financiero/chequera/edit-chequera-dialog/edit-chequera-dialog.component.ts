import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Chequera, ChequeraInput, EstadoChequera } from '../chequera.model';
import { ChequeraService } from '../chequera.service';
import { CuentaBancaria } from '../../cuenta-bancaria/cuenta-bancaria.model';
import { CuentaBancariaService } from '../../cuenta-bancaria/cuenta-bancaria.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { esTimeoutDeLink, TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { take } from 'rxjs/operators';
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

    const sinCuentas = 'No se pudieron cargar las cuentas bancarias: cerrá y volvé a abrir para reintentar.';
    this.cuentaBancariaService.onGetAllOperables(PROPAGAR_ERROR_DE_RED,
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (res == null) { this.notificacion.openWarn(sinCuentas, 5); return; }
        this.cuentas = res;
        const ch = this.data?.chequera;
        if (ch?.cuentaBancaria?.id) {
          const sel = this.cuentas.find(c => c.id === ch.cuentaBancaria.id);
          if (sel) this.cuentaControl.setValue(sel);
        }
      },
      error: () => this.notificacion.openWarn(sinCuentas, 5)
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

    if (this.isSaving) return;
    this.isSaving = true;
    // Mientras se guarda no se cierra (ni Esc ni clic afuera): la lista de chequeras no se releería.
    this.dialogRef.disableClose = true;
    const fin = () => { this.isSaving = false; this.dialogRef.disableClose = false; };
    this.chequeraService.onSaveChequera(input, PROPAGAR_ERROR_DE_RED).pipe(take(1), untilDestroyed(this)).subscribe({
      next: res => {
        fin();
        if (res != null) {
          this.notificacion.openSucess(this.esEdicion ? 'Chequera actualizada' : 'Chequera creada');
          this.dialogRef.close(true);
        } else {
          this.sinConfirmar(true);
        }
      },
      error: err => {
        fin();
        // Rechazo: no se guardó nada y el motivo ya lo mostró el servicio genérico (llega como arreglo: antes
        // se buscaba `graphQLErrors`, que ahí no existe, y encima salía un «No se pudo guardar» sin motivo).
        if (erroresDeRechazo(err)) return;
        // El corte del link ya avisó que pudo haberse aplicado.
        this.sinConfirmar(!esTimeoutDeLink(err));
      },
    });
  }

  /**
   * El guardado pudo haberse aplicado (#390). Un **alta** repetida crea otra chequera con el mismo rango de
   * números: se cierra y la lista se relee. Una **edición** lleva su id y se puede repetir, pero manda el
   * «siguiente número» que había al abrir: si se emitió un cheque en el medio, lo pisa.
   */
  private sinConfirmar(avisar: boolean) {
    if (this.esEdicion) {
      if (avisar) {
        this.notificacion.openWarn('No se pudo confirmar si se guardó. Revisá el siguiente número de la chequera antes de guardar de nuevo.', 8);
      }
      return;
    }
    if (avisar) {
      this.notificacion.openWarn('No se pudo confirmar si la chequera se creó: revisá la lista antes de cargarla de nuevo.', 8);
    }
    this.dialogRef.close(true);
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
