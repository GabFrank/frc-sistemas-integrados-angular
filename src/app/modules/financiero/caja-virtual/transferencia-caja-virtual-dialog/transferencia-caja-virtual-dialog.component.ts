import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin } from 'rxjs';
import { CajaVirtual } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { MainService } from '../../../../main.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-transferencia-caja-virtual-dialog',
  templateUrl: './transferencia-caja-virtual-dialog.component.html',
  styleUrls: ['./transferencia-caja-virtual-dialog.component.scss']
})
export class TransferenciaCajaVirtualDialogComponent implements OnInit {

  formGroup: FormGroup;
  cantidadGsControl = new FormControl(null, [Validators.min(0.01)]);
  cantidadRsControl = new FormControl(null, [Validators.min(0.01)]);
  cantidadDsControl = new FormControl(null, [Validators.min(0.01)]);
  cajaDestinoControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl('');

  monedaGs: Moneda;
  monedaRs: Moneda;
  monedaDs: Moneda;

  currencyOptionsGs: any;
  currencyOptionsRs: any;
  currencyOptionsDs: any;

  cajasList: CajaVirtual[] = [];
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<TransferenciaCajaVirtualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public cajaOrigen: CajaVirtual,
    private cajaVirtualService: CajaVirtualService,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      cantidadGsControl: this.cantidadGsControl,
      cantidadRsControl: this.cantidadRsControl,
      cantidadDsControl: this.cantidadDsControl,
      cajaDestinoControl: this.cajaDestinoControl,
      descripcionControl: this.descripcionControl,
    });

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.monedaGs = res.find(m => m.denominacion?.toUpperCase().includes('GUARANI'));
        this.monedaRs = res.find(m => m.denominacion?.toUpperCase().includes('REAL'));
        this.monedaDs = res.find(m => m.denominacion?.toUpperCase().includes('DOLAR'));

        if (this.monedaGs) this.currencyOptionsGs = this.monedaService.currencyOptionsByMoneda(this.monedaGs);
        if (this.monedaRs) this.currencyOptionsRs = this.monedaService.currencyOptionsByMoneda(this.monedaRs);
        if (this.monedaDs) this.currencyOptionsDs = this.monedaService.currencyOptionsByMoneda(this.monedaDs);
      }
    });

    this.cajaVirtualService.onGetActivas().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.cajasList = res.filter(c => c.id !== this.cajaOrigen?.id);
      }
    });
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const cajaDestino: CajaVirtual = this.cajaDestinoControl.value;
    let obsList = [];

    const amtGs = this.cantidadGsControl.value;
    const amtRs = this.cantidadRsControl.value;
    const amtDs = this.cantidadDsControl.value;

    if (!amtGs && !amtRs && !amtDs) {
      this.notificacion.openAlgoSalioMal('Debe ingresar al menos un monto a transferir');
      return;
    }

    if (amtGs > 0 && this.monedaGs) {
      obsList.push(this.createTransferObs(amtGs, this.monedaGs.id, cajaDestino.id));
    }
    if (amtRs > 0 && this.monedaRs) {
       obsList.push(this.createTransferObs(amtRs, this.monedaRs.id, cajaDestino.id));
    }
    if (amtDs > 0 && this.monedaDs) {
       obsList.push(this.createTransferObs(amtDs, this.monedaDs.id, cajaDestino.id));
    }

    if (obsList.length === 0) return;

    this.isSaving = true;
    forkJoin(obsList)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (resArray) => {
          this.isSaving = false;
          this.notificacion.openSucess('Transferencia(s) realizada(s) correctamente');
          this.dialogRef.close(true);
        },
        error: err => {
          this.isSaving = false;
          this.notificacion.openAlgoSalioMal(err?.message || 'Error al guardar transferencia');
        }
      });
  }

  createTransferObs(cantidad: number, monedaId: number, cajaDestinoId: number) {
    return this.cajaVirtualService.onRealizarTransferencia(
      this.cajaOrigen.id,
      cajaDestinoId,
      cantidad,
      monedaId,
      this.descripcionControl.value?.toUpperCase() || null,
      this.mainService.usuarioActual?.id
    );
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
