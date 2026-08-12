import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntradaVaria, EntradaVariaCategoria } from '../entrada-varia.model';
import { EntradaVariaService } from '../entrada-varia.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { FormaPago } from '../../forma-pago/forma-pago.model';
import { FormaPagoService } from '../../forma-pago/forma-pago.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { MainService } from '../../../../main.service';

export interface EntradaVariaDialogData {
  cajaVirtual: CajaVirtual;
  esIngreso: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-entrada-varia-dialog',
  templateUrl: './add-entrada-varia-dialog.component.html',
  styleUrls: ['./add-entrada-varia-dialog.component.scss']
})
export class AddEntradaVariaDialogComponent implements OnInit {

  formGroup: FormGroup;
  montoControl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
  monedaControl = new FormControl(null, Validators.required);
  categoriaControl = new FormControl(null);
  formaPagoControl = new FormControl(null);
  descripcionControl = new FormControl('', Validators.required);
  numeroComprobanteControl = new FormControl('');

  monedaList: Moneda[] = [];
  categoriaList: EntradaVariaCategoria[] = [];
  formaPagoList: FormaPago[] = [];

  currencyOptions: any;

  isSaving = false;
  titulo = 'Entrada Varia';

  constructor(
    private dialogRef: MatDialogRef<AddEntradaVariaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EntradaVariaDialogData,
    private entradaVariaService: EntradaVariaService,
    private monedaService: MonedaService,
    private formaPagoService: FormaPagoService,
    private notificacion: NotificacionSnackbarService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      montoControl: this.montoControl,
      monedaControl: this.monedaControl,
      categoriaControl: this.categoriaControl,
      formaPagoControl: this.formaPagoControl,
      descripcionControl: this.descripcionControl,
      numeroComprobanteControl: this.numeroComprobanteControl,
    });

    this.titulo = this.data?.esIngreso ? 'Ingreso Vario' : 'Egreso Vario';

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.monedaList = res;
        const gs = res.find(m => m.denominacion?.toUpperCase().includes('GUARANI'));
        this.monedaControl.setValue(gs ?? res[0]);
        this.onMonedaChange();
      }
    });

    this.entradaVariaService.onGetCategorias().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.categoriaList = res;
    });

    this.formaPagoService.formaPagoSub.pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.formaPagoList = res;
    });
  }

  onMonedaChange() {
    if (this.monedaControl.value) {
      this.currencyOptions = this.monedaService.currencyOptionsByMoneda(this.monedaControl.value);
    }
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const entradaVaria = new EntradaVaria();
    entradaVaria.descripcion = this.descripcionControl.value;
    entradaVaria.monto = this.montoControl.value;
    entradaVaria.esIngreso = !!this.data?.esIngreso;
    entradaVaria.cajaVirtual = this.data?.cajaVirtual;
    entradaVaria.moneda = this.monedaControl.value;
    entradaVaria.categoria = this.categoriaControl.value;
    entradaVaria.formaPago = this.formaPagoControl.value;
    entradaVaria.numeroComprobante = this.numeroComprobanteControl.value;

    this.isSaving = true;
    this.entradaVariaService.onRegistrar(entradaVaria)
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
          this.notificacion.openAlgoSalioMal(err?.message || 'Error al registrar el movimiento');
        }
      });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
