import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual } from '../caja-virtual.model';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../personas/funcionarios/funcionario.service';
import { MotivoValeService } from '../../../rrhh/motivo-vale/motivo-vale.service';
import { ValeService } from '../../../rrhh/vale/vale.service';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export interface RegistrarValeDialogData {
  cajaVirtual: CajaVirtual;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-registrar-vale-dialog',
  templateUrl: './registrar-vale-dialog.component.html',
  styleUrls: ['./registrar-vale-dialog.component.scss']
})
export class RegistrarValeDialogComponent implements OnInit {

  funcionarioControl = new FormControl(null, Validators.required);
  motivoControl = new FormControl(null);
  monedaControl = new FormControl(null, Validators.required);
  montoControl = new FormControl(null, [Validators.required, Validators.min(0.01)]);
  esAdelantoControl = new FormControl(true);
  observacionControl = new FormControl('');

  funcionarioFiltrados: Funcionario[] = [];
  motivoList: any[] = [];
  monedaList: Moneda[] = [];

  currencyOpts: any = this.buildCurrencyOptions(null);
  isSaving = false;

  // El funcionario se busca por nombre (autocomplete server-side).
  displayFuncionario = (f: Funcionario): string => (f && f.persona) ? (f.persona.nombre || '') : '';

  constructor(
    private dialogRef: MatDialogRef<RegistrarValeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegistrarValeDialogData,
    private monedaService: MonedaService,
    private funcionarioService: FuncionarioService,
    private motivoValeService: MotivoValeService,
    private valeService: ValeService,
    private mainService: MainService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.monedaList = res;
        const principal = res.find((m: Moneda) => (m as any).principal) || res[0];
        if (principal) { this.monedaControl.setValue(principal); this.actualizarCurrencyOpts(); }
      }
    });
    this.motivoValeService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.motivoList = res;
    });

    // Autocomplete de funcionario por nombre.
    this.funcionarioControl.valueChanges.pipe(untilDestroyed(this)).subscribe(val => {
      if (typeof val === 'string' && val.trim().length >= 2) {
        this.funcionarioService.onFuncionarioSearch(val.trim()).pipe(untilDestroyed(this)).subscribe(res => {
          this.funcionarioFiltrados = res || [];
        });
      } else if (typeof val !== 'string') {
        this.funcionarioFiltrados = [];
      }
    });
  }

  onMonedaChange() { this.actualizarCurrencyOpts(); }

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
    if (!this.funcionarioControl.value?.id) return this.err('Seleccione un funcionario válido de la lista');
    if (this.monedaControl.invalid) return this.err('Seleccione la moneda');
    if (!this.montoControl.value || this.montoControl.value <= 0) return this.err('Ingrese un monto válido');

    const input = {
      funcionarioId: this.funcionarioControl.value?.id,
      motivoId: this.motivoControl.value?.id || null,
      monto: this.montoControl.value,
      monedaId: this.monedaControl.value?.id,
      fecha: dateToString(new Date()),
      esAdelanto: !!this.esAdelantoControl.value,
      observacion: this.observacionControl.value || null,
      usuarioId: this.mainService.usuarioActual?.id,
    };

    this.isSaving = true;
    this.valeService.onCrearConfirmado(input, this.data.cajaVirtual?.id, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res != null) {
            this.notificacion.openSucess('Vale registrado y confirmado');
            this.dialogRef.close(res);
          }
        },
        error: err => {
          this.isSaving = false;
          const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Error al registrar el vale';
          this.notificacion.openWarn(msg, 6);
        }
      });
  }

  private err(msg: string) { this.notificacion.openAlgoSalioMal(msg); }
  onCancel() { this.dialogRef.close(null); }
}
