import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual, MovimientoCajaVirtual, CajaVirtualTipoMovimiento } from '../caja-virtual.model';
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
  cantidadControl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
  monedaControl = new FormControl(null, Validators.required);
  cajaDestinoControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl('');

  monedaList: Moneda[] = [];
  cajasList: CajaVirtual[] = [];
  isSaving = false;
  currencyOptions: any;

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
      cantidadControl: this.cantidadControl,
      monedaControl: this.monedaControl,
      cajaDestinoControl: this.cajaDestinoControl,
      descripcionControl: this.descripcionControl,
    });

    // Cargar monedas
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.monedaList = res;
        const guarani = res.find(m => m.denominacion?.toUpperCase().includes('GUARANI'));
        if (guarani) {
          this.monedaControl.setValue(guarani);
          this.currencyOptions = this.monedaService.currencyOptionsGuarani;
        }
      }
    });

    // Cargar cajas destino (todas activas, excepto la origen)
    this.cajaVirtualService.onGetActivas().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.cajasList = res.filter(c => c.id !== this.cajaOrigen?.id);
      }
    });

    this.monedaControl.valueChanges.pipe(untilDestroyed(this)).subscribe((moneda: Moneda) => {
      if (moneda) {
        this.currencyOptions = this.monedaService.currencyOptionsByMoneda(moneda);
        this.cantidadControl.setValue(null);
      }
    });
  }

  getSaldoActual(): number {
    const moneda: Moneda = this.monedaControl.value;
    if (!moneda || !this.cajaOrigen) return 0;
    if (moneda.denominacion?.toUpperCase().includes('GUARANI')) return this.cajaOrigen.saldoGs ?? 0;
    if (moneda.denominacion?.toUpperCase().includes('REAL')) return this.cajaOrigen.saldoRs ?? 0;
    if (moneda.denominacion?.toUpperCase().includes('DOLAR')) return this.cajaOrigen.saldoDs ?? 0;
    return 0;
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const moneda: Moneda = this.monedaControl.value;
    const cajaDestino: CajaVirtual = this.cajaDestinoControl.value;

    this.isSaving = true;
    this.cajaVirtualService.onRealizarTransferencia(
      this.cajaOrigen.id,
      cajaDestino.id,
      this.cantidadControl.value,
      moneda.id,
      this.descripcionControl.value?.toUpperCase() || null,
      this.mainService.usuarioActual?.id
    ).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        this.notificacion.openSucess('Transferencia realizada correctamente');
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving = false;
        this.notificacion.openAlgoSalioMal(err?.message);
      }
    });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
