import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OperacionFinanciera, OperacionFinancieraCategoria, TipoOperacionFinanciera } from '../operacion-financiera.model';
import { OperacionFinancieraService } from '../operacion-financiera.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { CuentaBancaria } from '../../cuenta-bancaria/cuenta-bancaria.model';
import { CuentaBancariaService } from '../../cuenta-bancaria/cuenta-bancaria.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-operacion-financiera-dialog',
  templateUrl: './add-operacion-financiera-dialog.component.html',
  styleUrls: ['./add-operacion-financiera-dialog.component.scss']
})
export class AddOperacionFinancieraDialogComponent implements OnInit {

  formGroup: FormGroup;
  tipoOperacionControl = new FormControl(null, Validators.required);
  categoriaControl = new FormControl(null);
  descripcionControl = new FormControl('');
  numeroComprobanteControl = new FormControl('');

  cajaMayorOrigenControl = new FormControl(null);
  cuentaBancariaOrigenControl = new FormControl(null);
  monedaOrigenControl = new FormControl(null);
  montoOrigenControl = new FormControl(null, Validators.min(0.01));

  cajaMayorDestinoControl = new FormControl(null);
  cuentaBancariaDestinoControl = new FormControl(null);
  monedaDestinoControl = new FormControl(null);
  montoDestinoControl = new FormControl(null, Validators.min(0.01));

  cotizacionControl = new FormControl(null);

  tipoOperacionList = [
    { label: 'Cambio de Divisa', value: TipoOperacionFinanciera.CAMBIO_DIVISA },
    { label: 'Depósito Bancario', value: TipoOperacionFinanciera.DEPOSITO_BANCARIO },
    { label: 'Retiro Bancario', value: TipoOperacionFinanciera.RETIRO_BANCARIO },
    { label: 'Transferencia entre Cajas', value: TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS },
    { label: 'Transferencia Bancaria', value: TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA },
  ];

  categoriaList: OperacionFinancieraCategoria[] = [];
  cajaVirtualList: CajaVirtual[] = [];
  cuentaBancariaList: CuentaBancaria[] = [];
  monedaList: Moneda[] = [];

  // Flags de visibilidad — calculados en TS al cambiar el tipo, NUNCA en el HTML.
  mostrarCajaOrigen = false;
  mostrarCuentaOrigen = false;
  mostrarCajaDestino = false;
  mostrarCuentaDestino = false;
  mostrarCotizacion = false;

  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<AddOperacionFinancieraDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private operacionFinancieraService: OperacionFinancieraService,
    private cajaVirtualService: CajaVirtualService,
    private cuentaBancariaService: CuentaBancariaService,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService,
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      tipoOperacionControl: this.tipoOperacionControl,
      categoriaControl: this.categoriaControl,
      descripcionControl: this.descripcionControl,
      numeroComprobanteControl: this.numeroComprobanteControl,
      cajaMayorOrigenControl: this.cajaMayorOrigenControl,
      cuentaBancariaOrigenControl: this.cuentaBancariaOrigenControl,
      monedaOrigenControl: this.monedaOrigenControl,
      montoOrigenControl: this.montoOrigenControl,
      cajaMayorDestinoControl: this.cajaMayorDestinoControl,
      cuentaBancariaDestinoControl: this.cuentaBancariaDestinoControl,
      monedaDestinoControl: this.monedaDestinoControl,
      montoDestinoControl: this.montoDestinoControl,
      cotizacionControl: this.cotizacionControl,
    });

    this.operacionFinancieraService.onGetCategorias().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.categoriaList = res;
    });

    this.cajaVirtualService.onGetActivas().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.cajaVirtualList = res;
    });

    this.cuentaBancariaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.cuentaBancariaList = res;
    });

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.monedaList = res;
    });
  }

  onTipoOperacionChange() {
    const tipo = this.tipoOperacionControl.value;

    this.mostrarCajaOrigen = [
      TipoOperacionFinanciera.CAMBIO_DIVISA,
      TipoOperacionFinanciera.DEPOSITO_BANCARIO,
      TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS
    ].includes(tipo);

    this.mostrarCuentaOrigen = [
      TipoOperacionFinanciera.RETIRO_BANCARIO,
      TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA
    ].includes(tipo);

    this.mostrarCajaDestino = [
      TipoOperacionFinanciera.CAMBIO_DIVISA,
      TipoOperacionFinanciera.RETIRO_BANCARIO,
      TipoOperacionFinanciera.TRANSFERENCIA_ENTRE_CAJAS
    ].includes(tipo);

    this.mostrarCuentaDestino = [
      TipoOperacionFinanciera.DEPOSITO_BANCARIO,
      TipoOperacionFinanciera.TRANSFERENCIA_BANCARIA
    ].includes(tipo);

    this.mostrarCotizacion = tipo === TipoOperacionFinanciera.CAMBIO_DIVISA;

    // Limpiar selecciones que ya no correspondan al tipo elegido
    if (!this.mostrarCajaOrigen) this.cajaMayorOrigenControl.setValue(null);
    if (!this.mostrarCuentaOrigen) this.cuentaBancariaOrigenControl.setValue(null);
    if (!this.mostrarCajaDestino) this.cajaMayorDestinoControl.setValue(null);
    if (!this.mostrarCuentaDestino) this.cuentaBancariaDestinoControl.setValue(null);
    if (!this.mostrarCotizacion) this.cotizacionControl.setValue(null);
  }

  // La caja mayor maneja Gs/R$/US$ en simultáneo (no tiene una única moneda propia),
  // por eso al elegir una caja mayor el usuario igual debe elegir la moneda a mano.
  // Al elegir una cuenta bancaria sí autocompletamos porque esa cuenta es de una sola moneda.
  onCuentaOrigenChange() {
    const cuenta: CuentaBancaria = this.cuentaBancariaOrigenControl.value;
    if (cuenta?.moneda) this.monedaOrigenControl.setValue(cuenta.moneda);
  }

  onCuentaDestinoChange() {
    const cuenta: CuentaBancaria = this.cuentaBancariaDestinoControl.value;
    if (cuenta?.moneda) this.monedaDestinoControl.setValue(cuenta.moneda);
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const tipo: TipoOperacionFinanciera = this.tipoOperacionControl.value;

    if (this.mostrarCajaOrigen && !this.cajaMayorOrigenControl.value) {
      this.notificacion.openAlgoSalioMal('Seleccione la caja mayor de origen');
      return;
    }
    if (this.mostrarCuentaOrigen && !this.cuentaBancariaOrigenControl.value) {
      this.notificacion.openAlgoSalioMal('Seleccione la cuenta bancaria de origen');
      return;
    }
    if (this.mostrarCajaDestino && !this.cajaMayorDestinoControl.value) {
      this.notificacion.openAlgoSalioMal('Seleccione la caja mayor de destino');
      return;
    }
    if (this.mostrarCuentaDestino && !this.cuentaBancariaDestinoControl.value) {
      this.notificacion.openAlgoSalioMal('Seleccione la cuenta bancaria de destino');
      return;
    }
    if (!this.montoOrigenControl.value || !this.montoDestinoControl.value) {
      this.notificacion.openAlgoSalioMal('Debe ingresar el monto de origen y de destino');
      return;
    }

    const operacion = new OperacionFinanciera();
    operacion.tipoOperacion = tipo;
    operacion.categoria = this.categoriaControl.value;
    operacion.descripcion = this.descripcionControl.value;
    operacion.numeroComprobante = this.numeroComprobanteControl.value;
    operacion.cajaMayorOrigen = this.mostrarCajaOrigen ? this.cajaMayorOrigenControl.value : null;
    operacion.cuentaBancariaOrigen = this.mostrarCuentaOrigen ? this.cuentaBancariaOrigenControl.value : null;
    operacion.monedaOrigen = this.monedaOrigenControl.value;
    operacion.montoOrigen = this.montoOrigenControl.value;
    operacion.cajaMayorDestino = this.mostrarCajaDestino ? this.cajaMayorDestinoControl.value : null;
    operacion.cuentaBancariaDestino = this.mostrarCuentaDestino ? this.cuentaBancariaDestinoControl.value : null;
    operacion.monedaDestino = this.monedaDestinoControl.value;
    operacion.montoDestino = this.montoDestinoControl.value;
    operacion.cotizacion = this.cotizacionControl.value;

    this.isSaving = true;
    this.operacionFinancieraService.onRegistrar(operacion)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res != null) {
            this.notificacion.openSucess('Operación financiera registrada correctamente');
            this.dialogRef.close(res);
          }
        },
        error: err => {
          this.isSaving = false;
          this.notificacion.openAlgoSalioMal(err?.message || 'Error al registrar la operación financiera');
        }
      });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
