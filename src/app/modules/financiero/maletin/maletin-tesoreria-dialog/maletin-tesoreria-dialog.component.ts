import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { Maletin } from '../maletin.model';
import { MaletinService } from '../maletin.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

export interface MaletinTesoreriaDialogData {
  cajaVirtual: CajaVirtual;
  esEgreso: boolean;
}

interface ValorItem { total: number; moneda: Moneda; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-maletin-tesoreria-dialog',
  templateUrl: './maletin-tesoreria-dialog.component.html',
  styleUrls: ['./maletin-tesoreria-dialog.component.scss']
})
export class MaletinTesoreriaDialogComponent implements OnInit {

  esEgreso = false;
  titulo = '';

  maletinControl = new FormControl(null, Validators.required);
  monedaControl = new FormControl(null, Validators.required);
  montoControl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
  descripcionControl = new FormControl('');

  maletinList: Maletin[] = [];
  monedaList: Moneda[] = [];
  // Valor por moneda dentro del maletín (solo ingreso): del último cierre de la caja que lo usó.
  valorItems: ValorItem[] = [];
  cargandoValor = false;

  currencyOpts: any = this.buildCurrencyOptions(null);
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<MaletinTesoreriaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MaletinTesoreriaDialogData,
    private maletinService: MaletinService,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.esEgreso = !!this.data?.esEgreso;
    this.titulo = this.esEgreso ? 'Egreso de Maletín' : 'Ingreso de Maletín';

    this.maletinService.onGetAll(0, 500).pipe(untilDestroyed(this)).subscribe(res => {
      const items = res?.getContent || res || [];
      this.maletinList = (items as Maletin[]).filter(m => m.activo !== false);
    });
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.monedaList = res;
    });
  }

  onMaletinChange() {
    // El valor precargado solo aplica al ingreso (lo que quedó físicamente en el maletín).
    if (this.esEgreso) return;
    const maletin: Maletin = this.maletinControl.value;
    if (!maletin?.id) return;
    this.cargandoValor = true;
    this.valorItems = [];
    this.maletinService.onGetValor(maletin.id).pipe(untilDestroyed(this)).subscribe({
      next: (res: ValorItem[]) => {
        this.cargandoValor = false;
        this.valorItems = res || [];
        if (this.valorItems.length > 0) {
          // Preselecciona la primera moneda con valor y precarga su monto (editable).
          const item = this.valorItems[0];
          const moneda = this.resolverMoneda(item.moneda);
          this.monedaControl.setValue(moneda);
          this.actualizarCurrencyOpts();
          this.montoControl.setValue(item.total);
        }
      },
      error: () => { this.cargandoValor = false; }
    });
  }

  onMonedaChange() {
    this.actualizarCurrencyOpts();
    // En ingreso, si la moneda elegida tiene valor en el maletín, precarga ese monto.
    if (!this.esEgreso) {
      const moneda: Moneda = this.monedaControl.value;
      const item = this.valorItems.find(v => v.moneda?.id === moneda?.id);
      if (item) this.montoControl.setValue(item.total);
    }
  }

  private resolverMoneda(m: Moneda | null | undefined): Moneda | null {
    if (!m) return null;
    return this.monedaList.find(x => x.id === m.id) || m;
  }

  private actualizarCurrencyOpts() {
    this.currencyOpts = this.buildCurrencyOptions(this.monedaControl.value);
  }

  /** Formato PY: Gs sin decimales, resto 2; miles ".", decimal ","; sin negativos. */
  private buildCurrencyOptions(moneda: Moneda | null): any {
    const decimales = moneda?.decimales != null ? moneda.decimales : ((moneda?.denominacion || '').toUpperCase().includes('GUARANI') ? 0 : 2);
    return {
      allowNegative: false, allowZero: false, precision: decimales,
      thousands: '.', decimal: decimales > 0 ? ',' : '', align: 'right',
      prefix: moneda?.simbolo ? moneda.simbolo + ' ' : '', suffix: '', nullable: true, min: 0, max: null,
    };
  }

  onSave() {
    if (this.maletinControl.invalid) return this.err('Seleccione el maletín');
    if (this.monedaControl.invalid) return this.err('Seleccione la moneda');
    if (!this.montoControl.value || this.montoControl.value <= 0) return this.err('Ingrese un monto válido');

    const cajaId = this.data.cajaVirtual?.id;
    const maletinId = this.maletinControl.value?.id;
    const monedaId = this.monedaControl.value?.id;
    const monto = this.montoControl.value;
    const desc = this.descripcionControl.value;

    this.isSaving = true;
    const obs = this.esEgreso
      ? this.maletinService.onEgresar(cajaId, maletinId, monedaId, monto, desc)
      : this.maletinService.onIngresar(cajaId, maletinId, monedaId, monto, desc);
    obs.pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res != null) {
          this.notificacion.openSucess(this.esEgreso ? 'Egreso de maletín registrado' : 'Ingreso de maletín registrado');
          this.dialogRef.close(res);
        }
      },
      error: err => {
        this.isSaving = false;
        const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Error al registrar el movimiento de maletín';
        this.notificacion.openWarn(msg, 6);
      }
    });
  }

  private err(msg: string) { this.notificacion.openAlgoSalioMal(msg); }

  onCancel() { this.dialogRef.close(null); }
}
