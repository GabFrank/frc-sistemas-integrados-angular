import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { NgxCurrencyModule } from 'ngx-currency';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin, interval, of, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { PdvCaja } from '../../../pdv/caja/caja.model';
import { QrCodeComponent } from '../../../../../shared/qr-code/qr-code.component';
import { GastoService } from '../../service/gasto.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { RetiroPreGastoLineaInput } from '../../models/retiro-pre-gasto-linea-input.model';
import { FuncionarioService } from '../../../../personas/funcionarios/funcionario.service';
import { Moneda } from '../../../moneda/moneda.model';
import { MonedaService } from '../../../moneda/moneda.service';
import { FilaMontoErrores } from '../../interface/fila-monto-errores.interface';
import { FilaMontoVista } from '../../interface/fila-monto-vista.interface';

export class RetiroPreGastoData {
  caja: PdvCaja;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-retiro-pre-gasto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    ReactiveFormsModule,
    NgxCurrencyModule,
  ],
  templateUrl: './retiro-pre-gasto-dialog.component.html',
  styleUrls: ['./retiro-pre-gasto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetiroPreGastoDialogComponent implements OnInit, OnDestroy {
  solicitudes: PreGasto[] = [];
  seleccionada: PreGasto | null = null;
  cargandoLista = false;
  cargandoQr = false;
  cargandoRetiro = false;
  codigoQr = '';
  funcionarioConfirmo = false;
  listaMonedas: Moneda[] = [];
  filasMonto = new FormArray<FormGroup>([]);
  filasMontoView: FilaMontoVista[] = [];
  montosEntregaValidos = false;
  compararMonedaId = (valorA: number | string | null, valorB: number | string | null): boolean =>
    Number(valorA) === Number(valorB);
  private pollSub: Subscription | null = null;
  private filasMontoInicializadasParaId: number | null = null;
  private cargandoFilasMonto = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RetiroPreGastoData,
    private dialogRef: MatDialogRef<RetiroPreGastoDialogComponent>,
    private gastoService: GastoService,
    private funcionarioService: FuncionarioService,
    private monedaService: MonedaService,
    private matDialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.suscribirEstadoMontosEntrega();
    this.cargarSolicitudes();
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.listaMonedas = res;
        this.intentarInicializarFilasMonto();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  cargarSolicitudes(): void {
    const sucursalCajaId = this.data?.caja?.sucursal?.id ?? this.data?.caja?.sucursalId;
    if (!sucursalCajaId) {
      return;
    }
    this.cargandoLista = true;
    this.gastoService.preGastosParaRetiro(sucursalCajaId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (lista) => {
          this.solicitudes = lista ?? [];
          this.cargandoLista = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoLista = false;
          this.notificacion.openAlgoSalioMal('No se pudieron cargar las solicitudes autorizadas.');
          this.cdr.markForCheck();
        },
      });
  }

  seleccionarSolicitud(item: PreGasto): void {
    this.seleccionada = item;
    this.funcionarioConfirmo = !!item.retiroConfirmadoEn;
    this.codigoQr = '';
    this.filasMontoInicializadasParaId = null;
    this.limpiarFilasMonto();
    this.detenerPolling();
    this.intentarInicializarFilasMonto();
    this.actualizarMontosEntregaValidos();
  }

  agregarFilaMonto(): void {
    this.agregarFilaMontoConValores(this.primeraMonedaDisponible(), null);
  }

  quitarFilaMonto(index: number): void {
    if (this.filasMonto.length <= 1) {
      return;
    }
    this.filasMonto.removeAt(index);
    this.filasMontoView.splice(index, 1);
    this.actualizarErroresMonedasDuplicadas();
    this.actualizarVistasFilasMonto();
    this.actualizarMontosEntregaValidos();
  }

  mostrarQrRetiro(): void {
    if (!this.seleccionada?.id || !this.seleccionada?.sucursalId) {
      return;
    }
    this.cargandoQr = true;
    this.gastoService.qrRetiroPreGasto(this.seleccionada.id, this.seleccionada.sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (payload) => {
          this.cargandoQr = false;
          if (!payload?.codigoQr) {
            this.notificacion.openWarn('No se pudo generar el código QR.');
            this.cdr.markForCheck();
            return;
          }
          this.codigoQr = payload.codigoQr;
          this.matDialog.open(QrCodeComponent, {
            data: { nombre: `Solicitud #${this.seleccionada.id}`, textoCustom: payload.codigoQr },
            width: '360px',
          });
          this.iniciarPolling();
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoQr = false;
          this.notificacion.openAlgoSalioMal('Error al generar QR de retiro.');
          this.cdr.markForCheck();
        },
      });
  }

  ejecutarRetiro(): void {
    if (!this.seleccionada || !this.funcionarioConfirmo) {
      this.notificacion.openWarn('El funcionario debe escanear el QR desde su celular primero.');
      return;
    }
    if (!this.montosEntregaValidos) {
      this.notificacion.openWarn('Complete la moneda y el monto a entregar.');
      this.actualizarErroresVistaFilasMonto();
      this.cdr.markForCheck();
      return;
    }
    const caja = this.data.caja;
    const sucursalCajaId = caja?.sucursal?.id ?? caja?.sucursalId;
    if (!caja?.id || !sucursalCajaId) {
      this.notificacion.openWarn('No se pudo determinar la caja activa.');
      return;
    }
    const lineas = this.obtenerLineasDesdeFormulario();
    this.cargandoRetiro = true;
    const personaResponsableId = this.seleccionada.funcionario?.id;
    const personaAutorizadorId = this.seleccionada.autorizadoPor?.id;
    if (!personaResponsableId) {
      this.cargandoRetiro = false;
      this.notificacion.openWarn('No se pudo determinar el funcionario responsable.');
      this.cdr.markForCheck();
      return;
    }
    forkJoin({
      responsable: this.funcionarioService.onGetFuncionarioPorPersona(personaResponsableId, true),
      autorizado: personaAutorizadorId
        ? this.funcionarioService.onGetFuncionarioPorPersona(personaAutorizadorId, true)
        : of(null),
    }).pipe(
      switchMap(({ responsable, autorizado }) => {
        if (!responsable?.id) {
          throw new Error('No se encontró el funcionario responsable.');
        }
        return this.gastoService.registrarRetiroPreGastoHibrido(
          this.seleccionada!,
          caja,
          responsable,
          autorizado,
          lineas,
          this.mainService.usuarioActual?.id
        );
      }),
      untilDestroyed(this)
    ).subscribe({
      next: (res) => {
        this.cargandoRetiro = false;
        if (res) {
          this.notificacion.openSucess('Retiro registrado en caja correctamente.');
          this.dialogRef.close(res);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoRetiro = false;
        this.notificacion.openAlgoSalioMal('No se pudo registrar el retiro en caja.');
        this.cdr.markForCheck();
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  private suscribirEstadoMontosEntrega(): void {
    this.filasMonto.statusChanges
      .pipe(startWith(this.filasMonto.status), untilDestroyed(this))
      .subscribe(() => this.actualizarMontosEntregaValidos());
  }

  private actualizarMontosEntregaValidos(): void {
    const valido =
      this.funcionarioConfirmo &&
      this.filasMonto.length > 0 &&
      this.filasMonto.valid;
    if (this.montosEntregaValidos === valido) {
      return;
    }
    this.montosEntregaValidos = valido;
    this.cdr.markForCheck();
  }

  private iniciarPolling(): void {
    if (!this.seleccionada?.id || !this.seleccionada?.sucursalId || this.funcionarioConfirmo) {
      return;
    }
    this.detenerPolling();
    const preGastoId = this.seleccionada.id;
    const sucursalId = this.seleccionada.sucursalId;
    this.pollSub = interval(4000)
      .pipe(
        switchMap(() => this.gastoService.preGastoRetiroConfirmado(preGastoId, sucursalId)),
        untilDestroyed(this)
      )
      .subscribe({
        next: (confirmado) => {
          if (!confirmado) {
            return;
          }
          this.detenerPolling();
          if (this.funcionarioConfirmo) {
            return;
          }
          this.funcionarioConfirmo = true;
          this.intentarInicializarFilasMonto();
          this.actualizarMontosEntregaValidos();
          this.cdr.markForCheck();
        },
      });
  }

  private detenerPolling(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = null;
    }
  }

  private intentarInicializarFilasMonto(): void {
    if (!this.seleccionada || !this.funcionarioConfirmo || this.listaMonedas.length === 0) {
      return;
    }
    if (this.filasMontoInicializadasParaId === this.seleccionada.id || this.cargandoFilasMonto) {
      return;
    }
    this.cargarFilasMontoDesdeBackend();
  }

  private cargarFilasMontoDesdeBackend(): void {
    const preGastoId = this.seleccionada?.id;
    const sucursalId = this.seleccionada?.sucursalId;
    if (!preGastoId || !sucursalId) {
      return;
    }
    this.cargandoFilasMonto = true;
    this.gastoService.lineasRetiroSugeridas(preGastoId, sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (lineas) => {
          this.cargandoFilasMonto = false;
          this.limpiarFilasMontoInterno();
          if (!lineas?.length) {
            this.agregarFilaMonto();
          } else {
            for (const linea of lineas) {
              this.agregarFilaMontoConValores(Number(linea.monedaId), Number(linea.monto));
            }
            this.actualizarErroresMonedasDuplicadas();
            this.actualizarVistasFilasMonto();
            this.actualizarMontosEntregaValidos();
          }
          this.filasMontoInicializadasParaId = preGastoId;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargandoFilasMonto = false;
          this.limpiarFilasMontoInterno();
          this.agregarFilaMonto();
          this.filasMontoInicializadasParaId = preGastoId;
          this.cdr.markForCheck();
        },
      });
  }

  private agregarFilaMontoConValores(monedaId: number | null, monto: number | null): void {
    const grupo = new FormGroup({
      monedaId: new FormControl<number | null>(monedaId != null ? Number(monedaId) : null, Validators.required),
      monto: new FormControl<number | null>(monto, [Validators.required, Validators.min(0.01)]),
    });
    this.aplicarValidadoresMontoPorMoneda(grupo);
    this.configurarFilaMonto(grupo);
    this.filasMonto.push(grupo);
    this.filasMontoView.push(this.crearVistaFilaMonto(grupo));
  }

  private obtenerLineasDesdeFormulario(): RetiroPreGastoLineaInput[] {
    return this.filasMonto.controls.map((control) => ({
      monedaId: Number(control.get('monedaId')?.value),
      monto: Number(control.get('monto')?.value),
    }));
  }

  private limpiarFilasMonto(): void {
    this.limpiarFilasMontoInterno();
    this.actualizarMontosEntregaValidos();
  }

  private limpiarFilasMontoInterno(): void {
    while (this.filasMonto.length > 0) {
      this.filasMonto.removeAt(0);
    }
    this.filasMontoView = [];
  }

  private configurarFilaMonto(grupo: FormGroup): void {
    grupo
      .get('monedaId')!
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe(() => {
        this.aplicarValidadoresMontoPorMoneda(grupo);
        this.actualizarErroresMonedasDuplicadas();
        this.actualizarVistasFilasMonto();
        this.actualizarMontosEntregaValidos();
      });

    grupo
      .get('monedaId')!
      .statusChanges.pipe(untilDestroyed(this))
      .subscribe(() => {
        this.actualizarErroresVistaFilasMonto();
        this.actualizarMontosEntregaValidos();
      });

    grupo
      .get('monto')!
      .statusChanges.pipe(untilDestroyed(this))
      .subscribe(() => {
        this.actualizarErroresVistaFilasMonto();
        this.actualizarMontosEntregaValidos();
      });
  }

  private crearVistaFilaMonto(grupo: FormGroup): FilaMontoVista {
    const monedaId = grupo.get('monedaId')?.value;
    return {
      grupo,
      opcionesCurrency: this.opcionesCurrencyPorMonedaId(monedaId),
      opcionesMoneda: this.construirOpcionesMoneda(monedaId, this.filasMontoView.length),
      errores: this.erroresInicialesFilaMonto(),
    };
  }

  private esMonedaGuarani(moneda: Moneda): boolean {
    return (moneda.denominacion || '').trim().toUpperCase() === 'GUARANI';
  }

  private primeraMonedaGuarani(): Moneda | undefined {
    return this.listaMonedas.find((moneda) => this.esMonedaGuarani(moneda));
  }

  private primeraMonedaDisponible(): number | null {
    const usadas = new Set(
      this.filasMonto.controls
        .map((control) => Number(control.get('monedaId')?.value))
        .filter((monedaId) => Number.isFinite(monedaId))
    );
    const disponible = this.listaMonedas.find((moneda) => !usadas.has(Number(moneda.id)));
    return disponible?.id != null
      ? Number(disponible.id)
      : this.primeraMonedaGuarani()?.id != null
        ? Number(this.primeraMonedaGuarani()!.id)
        : this.listaMonedas[0]?.id != null
          ? Number(this.listaMonedas[0].id)
          : null;
  }

  private construirOpcionesMoneda(monedaSeleccionada: number | string | null, filaIndex: number) {
    const monedaActual = Number(monedaSeleccionada);
    return this.listaMonedas
      .filter((moneda) => !this.monedaOcupadaEnOtraFila(Number(moneda.id), filaIndex) || Number(moneda.id) === monedaActual)
      .map((moneda) => ({
        moneda,
        deshabilitada: false,
      }));
  }

  private opcionesCurrencyPorMonedaId(monedaId: number | null | undefined): object {
    const moneda = this.listaMonedas.find((item) => Number(item.id) === Number(monedaId));
    return moneda
      ? this.monedaService.currencyOptionsByMoneda(moneda)
      : this.monedaService.currencyOptionsGuarani;
  }

  private aplicarValidadoresMontoPorMoneda(grupo: FormGroup): void {
    const moneda = this.listaMonedas.find((item) => Number(item.id) === Number(grupo.get('monedaId')?.value));
    const montoCtrl = grupo.get('monto');
    if (!montoCtrl) {
      return;
    }
    const esGuarani = moneda ? this.esMonedaGuarani(moneda) : true;
    montoCtrl.clearValidators();
    montoCtrl.addValidators([Validators.required, esGuarani ? Validators.min(1) : Validators.min(0.01)]);
    montoCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private monedaOcupadaEnOtraFila(monedaId: number | null | undefined, filaIndex: number): boolean {
    if (monedaId == null) {
      return false;
    }
    return this.filasMonto.controls.some((control, index) => {
      if (index === filaIndex) {
        return false;
      }
      return Number(control.get('monedaId')?.value) === Number(monedaId);
    });
  }

  private actualizarVistasFilasMonto(): void {
    this.filasMontoView.forEach((vista, filaIndex) => {
      const monedaId = vista.grupo.get('monedaId')?.value as number | null | undefined;
      vista.opcionesCurrency = this.opcionesCurrencyPorMonedaId(monedaId);
      vista.opcionesMoneda = this.construirOpcionesMoneda(monedaId, filaIndex);
    });
    this.actualizarErroresVistaFilasMonto();
  }

  private erroresInicialesFilaMonto(): FilaMontoErrores {
    return {
      monedaRequerida: false,
      monedaDuplicada: false,
      montoRequerido: false,
      montoMinimo: false,
    };
  }

  private actualizarErroresVistaFilasMonto(): void {
    this.filasMontoView.forEach((vista) => {
      const monedaCtrl = vista.grupo.get('monedaId');
      const montoCtrl = vista.grupo.get('monto');
      vista.errores = {
        monedaRequerida: !!monedaCtrl?.hasError('required'),
        monedaDuplicada: !!monedaCtrl?.hasError('monedaDuplicada'),
        montoRequerido: !!montoCtrl?.hasError('required'),
        montoMinimo: !!montoCtrl?.hasError('min'),
      };
    });
  }

  private actualizarErroresMonedasDuplicadas(): void {
    const cantidadPorMoneda = new Map<number, number>();

    this.filasMonto.controls.forEach((control) => {
      const monedaId = control.get('monedaId')?.value as number | null | undefined;
      if (monedaId != null) {
        const id = Number(monedaId);
        cantidadPorMoneda.set(id, (cantidadPorMoneda.get(id) ?? 0) + 1);
      }
    });

    this.filasMonto.controls.forEach((control) => {
      const monedaIdControl = control.get('monedaId');
      if (!monedaIdControl) {
        return;
      }
      const monedaId = monedaIdControl.value as number | null | undefined;
      const duplicada = monedaId != null && (cantidadPorMoneda.get(Number(monedaId)) ?? 0) > 1;
      this.setControlError(monedaIdControl, 'monedaDuplicada', duplicada);
    });
    this.actualizarErroresVistaFilasMonto();
    this.actualizarMontosEntregaValidos();
  }

  private setControlError(control: AbstractControl, key: string, enabled: boolean): void {
    const erroresActuales = control.errors ?? {};
    if (enabled) {
      if (!erroresActuales[key]) {
        control.setErrors({ ...erroresActuales, [key]: true });
      }
      return;
    }
    if (erroresActuales[key]) {
      const { [key]: _, ...resto } = erroresActuales;
      control.setErrors(Object.keys(resto).length > 0 ? resto : null);
    }
  }
}
