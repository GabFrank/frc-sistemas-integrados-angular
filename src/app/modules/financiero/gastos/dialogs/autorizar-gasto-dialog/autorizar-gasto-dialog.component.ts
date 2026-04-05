import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GastoService } from '../../service/gasto.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../../main.service';

export class AutorizarGastoData {
  preGasto: PreGasto;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-autorizar-gasto-dialog',
  templateUrl: './autorizar-gasto-dialog.component.html',
  styleUrls: ['./autorizar-gasto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutorizarGastoDialogComponent implements OnInit {
  preGasto: PreGasto;
  motivoRechazoControl = new FormControl('');
  mostrarMotivoRechazo = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AutorizarGastoData,
    private matDialogRef: MatDialogRef<AutorizarGastoDialogComponent>,
    private gastoService: GastoService,
    private cdr: ChangeDetectorRef,
    public mainService: MainService
  ) {
    this.preGasto = data.preGasto;
  }

  ngOnInit(): void { }

  autorizar(): void {
    const autorizadorId = this.mainService.usuarioActual?.persona?.id || this.preGasto.funcionario?.id;
    if (!autorizadorId) {
      console.error('No se pudo determinar el autorizador');
      return;
    }

    this.gastoService.preGastoAutorizar(this.preGasto.id, autorizadorId, this.preGasto.sucursalId)
      .pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.matDialogRef.close(res);
        }
      });
  }

  enviarATramite(): void {
    this.gastoService.preGastoTramitar(this.preGasto.id, this.preGasto.sucursalId)
      .pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.matDialogRef.close(res);
        }
      });
  }

  rechazar(): void {
    if (!this.mostrarMotivoRechazo) {
      this.mostrarMotivoRechazo = true;
      this.motivoRechazoControl.setValidators(Validators.required);
      this.motivoRechazoControl.updateValueAndValidity();
      this.cdr.markForCheck();
      return;
    }

    if (!this.motivoRechazoControl.valid) return;

    this.gastoService.preGastoRechazar(this.preGasto.id, this.motivoRechazoControl.value, this.preGasto.sucursalId)
      .pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.matDialogRef.close(res);
        }
      });
  }

  cancelar(): void {
    this.matDialogRef.close();
  }
}
