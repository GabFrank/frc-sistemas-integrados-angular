import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual, CajaVirtualTipoMovimiento, MovimientoCajaVirtual } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { MainService } from '../../../../main.service';

export interface MovimientoDialogData {
  cajaVirtual: CajaVirtual;
  tipoMovimiento: CajaVirtualTipoMovimiento;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-movimiento-caja-virtual-dialog',
  templateUrl: './add-movimiento-caja-virtual-dialog.component.html',
  styleUrls: ['./add-movimiento-caja-virtual-dialog.component.scss']
})
export class AddMovimientoCajaVirtualDialogComponent implements OnInit {

  formGroup: FormGroup;
  cantidadControl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
  monedaControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl('', Validators.required);

  monedaList: Moneda[] = [];
  isSaving = false;
  currencyOptions: any;

  tipoLabels = {
    [CajaVirtualTipoMovimiento.INGRESO]: 'Ingreso de Efectivo',
    [CajaVirtualTipoMovimiento.EGRESO]: 'Egreso de Efectivo',
    [CajaVirtualTipoMovimiento.AJUSTE]: 'Ajuste de Saldo',
  };

  constructor(
    private dialogRef: MatDialogRef<AddMovimientoCajaVirtualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovimientoDialogData,
    private cajaVirtualService: CajaVirtualService,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      cantidadControl: this.cantidadControl,
      monedaControl: this.monedaControl,
      descripcionControl: this.descripcionControl,
    });

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.monedaList = res;
        // Seleccionar Guaraní por defecto
        const guarani = res.find(m => m.denominacion?.toUpperCase().includes('GUARANI'));
        if (guarani) {
          this.monedaControl.setValue(guarani);
          this.currencyOptions = this.monedaService.currencyOptionsGuarani;
        }
      }
    });

    this.monedaControl.valueChanges.pipe(untilDestroyed(this)).subscribe((moneda: Moneda) => {
      if (moneda) {
        this.currencyOptions = this.monedaService.currencyOptionsByMoneda(moneda);
        this.cantidadControl.setValue(null);
      }
    });
  }

  getTitulo(): string {
    return this.tipoLabels[this.data?.tipoMovimiento] || 'Movimiento';
  }

  getSaldoActual(): number {
    const moneda: Moneda = this.monedaControl.value;
    if (!moneda || !this.data?.cajaVirtual) return 0;
    if (moneda.denominacion?.toUpperCase().includes('GUARANI')) return this.data.cajaVirtual.saldoGs ?? 0;
    if (moneda.denominacion?.toUpperCase().includes('REAL')) return this.data.cajaVirtual.saldoRs ?? 0;
    if (moneda.denominacion?.toUpperCase().includes('DOLAR')) return this.data.cajaVirtual.saldoDs ?? 0;
    return 0;
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const movimiento = new MovimientoCajaVirtual();
    movimiento.cajaVirtual = this.data.cajaVirtual;
    movimiento.tipoMovimiento = this.data.tipoMovimiento;
    movimiento.cantidad = this.cantidadControl.value;
    movimiento.moneda = this.monedaControl.value;
    movimiento.descripcion = this.descripcionControl.value?.toUpperCase();
    movimiento.usuario = this.mainService.usuarioActual;
    movimiento.activo = true;

    this.isSaving = true;
    this.cajaVirtualService.onSaveMovimiento(movimiento)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res != null) {
            this.notificacion.openSucess('Movimiento registrado correctamente');
            this.dialogRef.close(res);
          }
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
