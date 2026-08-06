import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { SolicitudPagoDetalleInput } from '../../compra/gestion-compras/solicitud-pago.model';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { CambioService } from '../../../financiero/cambio/cambio.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

import { Proveedor } from '../../../personas/proveedor/proveedor.model';

export interface AdicionarFormaPagoDialogData {
  monedaList: Moneda[];
  formaPagoList: FormaPago[];
  proveedorNombre?: string;
  /** Proveedor seleccionado (para usar chequeDias en cálculo de fecha de pago). */
  proveedor?: Pick<Proveedor, 'chequeDias'> | null;
  montoSugerido?: number;
  /** Si está en modo edición, se guarda en backend al confirmar. */
  solicitudPagoId?: number;
  /** Si se proporciona, el diálogo abre en modo edición (pre-carga el formulario y al confirmar cierra con el detalle sin llamar API). */
  detalleExistente?: SolicitudPagoDetalleInput & { monedaDenominacion?: string; formaPagoDescripcion?: string };
}

@Component({
  selector: 'app-adicionar-forma-pago-dialog',
  templateUrl: './adicionar-forma-pago-dialog.component.html',
  styleUrls: ['./adicionar-forma-pago-dialog.component.scss']
})
export class AdicionarFormaPagoDialogComponent {
  form: FormGroup;
  monedaList: Moneda[] = [];
  formaPagoList: FormaPago[] = [];
  proveedorNombreDisplay = '';
  mostrarCamposCheque = false;
  mostrarCotizacion = false;
  tituloDialogo = 'Adicionar forma de pago';
  textoBoton = 'Agregar';
  textoConfirmacion = '¿Desea agregar esta forma de pago?';
  isModoEdicion = false;
  /** Valor equivalente en Guaraníes (actualizado al cambiar moneda/valor/cotización). */
  valorEnGuaraniesDisplay = 0;
  /** Diferencia en Guaraníes (valorEnGuaraniesDisplay - montoSugerido). Positiva = exceso, negativa = falta. */
  diferenciaGsDisplay = 0;
  /** "cubre" | "exceso" | "falta" — para color/icono del card. */
  diferenciaEstado: 'cubre' | 'exceso' | 'falta' = 'falta';
  /** Origen actual del campo cotización: "mercado" | "manual" | "none". */
  cotizacionOrigen: 'mercado' | 'manual' | 'none' = 'none';
  /** Opciones ngx-currency para el campo Valor según moneda seleccionada (Guarani: sin decimales, punto miles; otras: decimales). */
  valorCurrencyOptions: any;
  /** Opciones ngx-currency para Cotización (siempre con decimales). */
  cotizacionCurrencyOptions: any;

  /** Cuotas de cheque: genera una forma de pago por cheque, encadenadas por intervalo de días. */
  intervalos = [7, 15, 30, 45];
  cuotasOpciones = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  /** true cuando es cheque, alta (no edición) y cuotas > 1 → se dividirá en varios cheques. */
  esMultiCuota = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AdicionarFormaPagoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdicionarFormaPagoDialogData,
    private solicitudPagoService: SolicitudPagoService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private monedaService: MonedaService,
    private cambioService: CambioService
  ) {
    this.monedaList = data?.monedaList || [];
    this.formaPagoList = data?.formaPagoList || [];
    this.proveedorNombreDisplay = (data?.proveedorNombre || '').toString().toUpperCase();
    const hoy = new Date();
    const diasCheque = data?.proveedor?.chequeDias != null ? Number(data.proveedor.chequeDias) : null;
    const fechaPagoInicial =
      diasCheque != null && !isNaN(diasCheque)
        ? (() => {
            const d = new Date(hoy);
            d.setDate(d.getDate() + diasCheque);
            return d;
          })()
        : null;
    this.form = this.fb.group({
      monedaId: [null, Validators.required],
      formaPagoId: [null, Validators.required],
      valor: [data?.montoSugerido ?? null, [Validators.required, Validators.min(0.01)]],
      fechaPago: [fechaPagoInicial],
      observacion: [''],
      cotizacion: [null],
      fechaEmisionCheque: [hoy],
      portador: [this.proveedorNombreDisplay],
      nominal: [true],
      diferido: [true],
      cuotas: [1],
      intervalo: [30]
    });
    this.form.get('cuotas').valueChanges.subscribe(() => this.updateMultiCuota());
    this.form.get('formaPagoId').valueChanges.subscribe((id) => {
      const fp = this.formaPagoList.find((f) => f.id === id);
      this.mostrarCamposCheque = fp?.descripcion != null && (fp.descripcion + '').toUpperCase().includes('CHEQUE');
      if (this.mostrarCamposCheque) {
        this.form.patchValue({
          fechaEmisionCheque: new Date(),
          fechaPago:
            diasCheque != null && !isNaN(diasCheque)
              ? (() => {
                  const d = new Date();
                  d.setDate(d.getDate() + diasCheque);
                  return d;
                })()
              : this.form.get('fechaPago').value
        });
      }
      this.updateMultiCuota();
    });
    this.form.get('monedaId').valueChanges.subscribe((id) => {
      const m = this.monedaList.find((mo) => mo.id === id);
      this.valorCurrencyOptions = m ? this.monedaService.currencyOptionsByMoneda(m) : this.monedaService.currencyOptionsGuarani;
      const denom = (m?.denominacion || '').toUpperCase();
      this.mostrarCotizacion = denom !== 'GUARANI' && denom !== 'GS' && denom !== '';
      if (this.mostrarCotizacion && m) {
        // Prefill cotización mercado siempre (compra > venta > último Cambio > moneda.cambio).
        this.prefillCotizacionMercado(m);
      } else if (!this.mostrarCotizacion && this.data?.montoSugerido != null && !this.isModoEdicion) {
        this.cotizacionOrigen = 'none';
        this.form.patchValue(
          { valor: this.data.montoSugerido },
          { emitEvent: false }
        );
        this.updateValorEnGuaraniesDisplay();
      }
    });
    this.cotizacionCurrencyOptions = this.monedaService.currencyOptionsNoGuarani;
    this.valorCurrencyOptions = this.monedaService.currencyOptionsGuarani;
    const existente = data?.detalleExistente;
    if (existente) {
      this.isModoEdicion = true;
      this.tituloDialogo = 'Editar forma de pago';
      this.textoBoton = 'Guardar';
      this.textoConfirmacion = '¿Desea guardar los cambios?';
      const moneda = this.monedaList.find((m) => m.id === existente.monedaId);
      const formaPago = this.formaPagoList.find((f) => f.id === existente.formaPagoId);
      this.mostrarCotizacion = moneda && (moneda.denominacion || '').toUpperCase() !== 'GUARANI' && (moneda.denominacion || '').toUpperCase() !== 'GS';
      this.mostrarCamposCheque = formaPago?.descripcion != null && (formaPago.descripcion + '').toUpperCase().includes('CHEQUE');
      const fechaPago = existente.fechaPago ? new Date(existente.fechaPago) : null;
      const fechaEmisionCheque = existente.fechaEmisionCheque ? new Date(existente.fechaEmisionCheque) : this.form.get('fechaEmisionCheque').value;
      this.form.patchValue({
        monedaId: existente.monedaId,
        formaPagoId: existente.formaPagoId,
        valor: existente.valor ?? null,
        fechaPago: fechaPago && !isNaN(fechaPago.getTime()) ? fechaPago : null,
        observacion: existente.observacion ?? '',
        cotizacion: existente.cotizacion ?? null,
        fechaEmisionCheque: fechaEmisionCheque,
        portador: existente.portador ?? this.proveedorNombreDisplay,
        nominal: existente.nominal ?? true,
        diferido: existente.diferido ?? true
      });
    }
    this.form.get('valor').valueChanges.subscribe(() => this.updateValorEnGuaraniesDisplay());
    this.form.get('cotizacion').valueChanges.subscribe(() => this.updateValorEnGuaraniesDisplay());
    this.updateValorEnGuaraniesDisplay();
  }

  /**
   * Trae la última cotización de mercado para la moneda y la setea como prefill editable.
   * Prioridad: valorEnGsCompraMercado → valorEnGsVentaMercado → valorEnGs → moneda.cambio.
   */
  private prefillCotizacionMercado(moneda: Moneda): void {
    const aplicarTasa = (tasa: number, origen: 'mercado' | 'manual' | 'none') => {
      this.cotizacionOrigen = origen;
      this.form.patchValue({ cotizacion: tasa }, { emitEvent: false });
      const montoGs = this.data?.montoSugerido;
      if (tasa > 0 && montoGs != null && montoGs > 0 && !this.isModoEdicion) {
        const valorEnMoneda = montoGs / tasa;
        this.form.patchValue(
          { valor: Math.round(valorEnMoneda * 100) / 100 },
          { emitEvent: false }
        );
      }
      this.updateValorEnGuaraniesDisplay();
    };
    this.cambioService.getUltimoCambioPorMonedaId(moneda.id).subscribe({
      next: (cambio: any) => {
        const tasaMercado = cambio?.valorEnGsCompraMercado ?? cambio?.valorEnGsVentaMercado;
        if (tasaMercado != null && tasaMercado > 0) {
          aplicarTasa(tasaMercado, 'mercado');
          return;
        }
        const tasaManual = cambio?.valorEnGs ?? moneda.cambio ?? 0;
        if (tasaManual > 0) aplicarTasa(tasaManual, 'manual');
        else aplicarTasa(moneda.cambio || 0, 'none');
      },
      error: () => {
        // Sin cambio registrado → fallback moneda.cambio
        aplicarTasa(moneda.cambio || 0, 'none');
      }
    });
  }

  /** Si el user edita la cotización manualmente, marcar origen para hint UI. */
  onCotizacionManualInput(): void {
    if (this.cotizacionOrigen === 'mercado') {
      this.cotizacionOrigen = 'manual';
    }
  }

  private updateValorEnGuaraniesDisplay(): void {
    const monedaId = this.form.get('monedaId').value;
    const valor = Number(this.form.get('valor').value);
    const moneda = this.monedaList.find((m) => m.id === monedaId);
    const denom = (moneda?.denominacion || '').toUpperCase();
    const esGuarani = denom === 'GUARANI' || denom === 'GS' || denom === '';
    if (esGuarani || isNaN(valor)) {
      this.valorEnGuaraniesDisplay = isNaN(valor) ? 0 : valor;
    } else {
      const cotizacion = Number(this.form.get('cotizacion').value);
      const tasa = cotizacion != null && !isNaN(cotizacion) && cotizacion > 0 ? cotizacion : moneda?.cambio ?? 0;
      this.valorEnGuaraniesDisplay = tasa > 0 ? Math.round((valor * tasa)) : 0;
    }
    const sugerido = this.data?.montoSugerido ?? 0;
    this.diferenciaGsDisplay = this.valorEnGuaraniesDisplay - sugerido;
    if (Math.abs(this.diferenciaGsDisplay) <= 1) {
      this.diferenciaEstado = 'cubre';
    } else if (this.diferenciaGsDisplay > 0) {
      this.diferenciaEstado = 'exceso';
    } else {
      this.diferenciaEstado = 'falta';
    }
  }

  /** Unidad mínima de redondeo según moneda: Guarani 500, USD 1, Real 0.5, resto 1. */
  private getUnidadMinima(moneda: Moneda | undefined): number {
    if (!moneda?.denominacion) return 1;
    const d = (moneda.denominacion + '').toUpperCase();
    if (d === 'GUARANI' || d === 'GS') return 500;
    if (d === 'USD' || d === 'DOLAR' || d === 'DÓLAR') return 1;
    if (d === 'REAL' || d === 'BRL' || d === 'REALES') return 0.5;
    return 1;
  }

  /** Redondeo hacia arriba según unidad mínima de la moneda. */
  onRedondeoUp(): void {
    const monedaId = this.form.get('monedaId').value;
    const moneda = this.monedaList.find((m) => m.id === monedaId);
    const unidad = this.getUnidadMinima(moneda);
    let valor = Number(this.form.get('valor').value);
    if (isNaN(valor) || valor < 0) valor = 0;
    const redondeado = Math.ceil(valor / unidad) * unidad;
    this.form.patchValue({ valor: Math.round(redondeado * 100) / 100 });
    this.updateValorEnGuaraniesDisplay();
  }

  /** Redondeo hacia abajo según unidad mínima de la moneda. */
  onRedondeoDown(): void {
    const monedaId = this.form.get('monedaId').value;
    const moneda = this.monedaList.find((m) => m.id === monedaId);
    const unidad = this.getUnidadMinima(moneda);
    let valor = Number(this.form.get('valor').value);
    if (isNaN(valor) || valor < 0) valor = 0;
    const redondeado = Math.floor(valor / unidad) * unidad;
    this.form.patchValue({ valor: Math.round(redondeado * 100) / 100 });
    this.updateValorEnGuaraniesDisplay();
  }

  /** Asigna al valor el monto total en la moneda seleccionada (valor * cotizacion = montoSugerido). */
  onValorTotal(): void {
    const montoGs = this.data?.montoSugerido;
    if (montoGs == null || montoGs <= 0) return;
    const monedaId = this.form.get('monedaId').value;
    const moneda = this.monedaList.find((m) => m.id === monedaId);
    const denom = (moneda?.denominacion || '').toUpperCase();
    const esGuarani = denom === 'GUARANI' || denom === 'GS' || denom === '';
    if (esGuarani) {
      this.form.patchValue({ valor: montoGs });
    } else {
      const cotizacion = Number(this.form.get('cotizacion').value);
      const tasa = cotizacion != null && !isNaN(cotizacion) && cotizacion > 0 ? cotizacion : moneda?.cambio ?? 0;
      if (tasa <= 0) return;
      const valorEnMoneda = montoGs / tasa;
      this.form.patchValue({ valor: Math.round(valorEnMoneda * 100) / 100 });
    }
    this.updateValorEnGuaraniesDisplay();
  }

  /** Recalcula si el cheque se dividirá en varias cuotas (una forma de pago por cheque). */
  private updateMultiCuota(): void {
    const cuotas = Number(this.form.get('cuotas')?.value) || 1;
    this.esMultiCuota = this.mostrarCamposCheque && !this.isModoEdicion && cuotas > 1;
  }

  onConfirmar(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    const detalles = this.buildDetallesArray();   // 1 forma, o N (una por cheque)
    const esVarias = detalles.length > 1;
    const titulo = this.isModoEdicion ? 'Guardar cambios' : 'Confirmar forma de pago';
    const mensaje = esVarias
      ? `Se crearán ${detalles.length} cheques (una forma de pago por cheque, cada ${this.form.get('intervalo').value} días). ¿Confirmar?`
      : this.textoConfirmacion;

    this.dialogosService.confirm(titulo, mensaje).subscribe((confirmed) => {
      if (!confirmed) return;

      // Edición de un detalle existente: siempre 1, el padre reemplaza (no persiste acá).
      if (this.isModoEdicion && this.data?.detalleExistente) {
        this.dialogRef.close([this.toRow(detalles[0])]);
        return;
      }

      const solicitudPagoId = this.data?.solicitudPagoId;
      if (solicitudPagoId != null) {
        // Modo edición de la solicitud: persistir cada detalle y devolver las filas guardadas.
        const calls = detalles.map((d) => this.solicitudPagoService.onAgregarSolicitudPagoDetalle(solicitudPagoId, d));
        forkJoin(calls.length ? calls : [of(null)]).subscribe({
          next: (savedList: any[]) => {
            const rows = (savedList || []).filter(Boolean).map((s) => this.mapSavedToRow(s));
            this.dialogRef.close(rows);
          },
          error: () => this.notificacionService.openAlgoSalioMal('No se pudo guardar la forma de pago')
        });
      } else {
        // Solicitud nueva (aún no creada): devolver los detalles sin guardar.
        this.dialogRef.close(detalles.map((d) => this.toRow(d)));
      }
    });
  }

  /**
   * Construye el/los detalle(s). Para cheque con cuotas > 1 genera una forma de pago por
   * cheque: divide el valor en N (última cuota absorbe el redondeo) y encadena la fecha de
   * pago por el intervalo de días desde la fecha de pago base.
   */
  private buildDetallesArray(): SolicitudPagoDetalleInput[] {
    const base = this.buildDetalleFromForm();
    const cuotas = this.esMultiCuota ? Math.max(1, Math.min(12, Number(this.form.get('cuotas').value) || 1)) : 1;
    if (cuotas <= 1) return [base];

    const intervalo = Number(this.form.get('intervalo').value) || 0;
    const moneda = this.monedaList.find((m) => m.id === base.monedaId);
    const unidad = this.getUnidadMinima(moneda);
    const total = base.valor || 0;
    const porCuota = Math.max(unidad, Math.floor((total / cuotas) / unidad) * unidad);
    const fechaBase = this.form.get('fechaPago').value instanceof Date
      ? this.form.get('fechaPago').value
      : (this.form.get('fechaPago').value ? new Date(this.form.get('fechaPago').value) : new Date());

    const detalles: SolicitudPagoDetalleInput[] = [];
    let acumulado = 0;
    for (let i = 0; i < cuotas; i++) {
      const ultima = i === cuotas - 1;
      const valor = ultima ? Math.round((total - acumulado) * 100) / 100 : porCuota;
      acumulado += valor;
      const fp = this.addDias(fechaBase, i * intervalo);
      detalles.push({ ...base, valor, fechaPago: dateToString(fp), orden: i + 1 });
    }
    return detalles;
  }

  private addDias(base: Date, dias: number): Date {
    const d = base ? new Date(base) : new Date();
    d.setDate(d.getDate() + dias);
    return d;
  }

  /** Envuelve un detalle con las descripciones de display para la tabla del padre. */
  private toRow(d: SolicitudPagoDetalleInput): SolicitudPagoDetalleInput & { monedaDenominacion?: string; formaPagoDescripcion?: string } {
    return {
      ...d,
      monedaDenominacion: (this.monedaList.find((m) => m.id === d.monedaId)?.denominacion || '').toString().toUpperCase(),
      formaPagoDescripcion: (this.formaPagoList.find((f) => f.id === d.formaPagoId)?.descripcion || '').toString().toUpperCase()
    };
  }

  private buildDetalleFromForm(): SolicitudPagoDetalleInput {
    const v = this.form.value;
    const valor = Number(v.valor);
    const detalle: SolicitudPagoDetalleInput = {
      monedaId: v.monedaId,
      formaPagoId: v.formaPagoId,
      valor: isNaN(valor) ? 0 : valor,
      observacion: (v.observacion || '').toString().trim().toUpperCase() || undefined,
      nominal: v.nominal,
      diferido: v.diferido
    };
    if (v.fechaPago) {
      const d = v.fechaPago instanceof Date ? v.fechaPago : new Date(v.fechaPago);
      if (!isNaN(d.getTime())) detalle.fechaPago = dateToString(d);
    }
    if (this.mostrarCotizacion && v.cotizacion != null) detalle.cotizacion = Number(v.cotizacion);
    if (this.mostrarCamposCheque) {
      if (v.fechaEmisionCheque) {
        const de = v.fechaEmisionCheque instanceof Date ? v.fechaEmisionCheque : new Date(v.fechaEmisionCheque);
        if (!isNaN(de.getTime())) detalle.fechaEmisionCheque = dateToString(de);
      }
      detalle.portador = (v.portador || '').toString().trim().toUpperCase() || undefined;
    }
    return detalle;
  }

  private mapSavedToRow(saved: any): SolicitudPagoDetalleInput & { id?: number; monedaDenominacion?: string; formaPagoDescripcion?: string } {
    const moneda = saved?.moneda;
    const formaPago = saved?.formaPago;
    return {
      id: saved?.id,
      monedaId: moneda?.id,
      formaPagoId: formaPago?.id,
      valor: saved?.valor,
      fechaPago: saved?.fechaPago,
      observacion: saved?.observacion,
      cotizacion: saved?.cotizacion,
      orden: saved?.orden,
      fechaEmisionCheque: saved?.fechaEmisionCheque,
      portador: saved?.portador,
      nominal: saved?.nominal,
      diferido: saved?.diferido,
      monedaDenominacion: (moneda?.denominacion || '').toString().toUpperCase(),
      formaPagoDescripcion: (formaPago?.descripcion || '').toString().toUpperCase()
    };
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
