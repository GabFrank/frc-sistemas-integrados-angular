import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { ConfiguracionFacturacion, ConfiguracionFacturacionInput, ModoFacturacion } from './configuracion-facturacion.model';
import { ConfiguracionFacturacionService } from './configuracion-facturacion.service';

/** Lo que muestra cada fila de la tabla, ya calculado: el template no llama funciones. */
interface FilaConfiguracion {
  config: ConfiguracionFacturacion;
  sucursalNombre: string;
  modoLabel: string;
  modoClase: string;
  respetaLabel: string;
  modificadoPor: string;
  modificadoEn: Date;
}

const MODO_LABELS: { [modo: string]: string } = {
  [ModoFacturacion.TODAS]: 'TODAS LAS VENTAS',
  [ModoFacturacion.INTERVALO]: 'CADA N VENTAS',
  [ModoFacturacion.A_PEDIDO]: 'SOLO A PEDIDO'
};

const MODO_CLASES: { [modo: string]: string } = {
  [ModoFacturacion.TODAS]: 'chip-todas',
  [ModoFacturacion.INTERVALO]: 'chip-intervalo',
  [ModoFacturacion.A_PEDIDO]: 'chip-pedido'
};

const MODO_HINTS: { [modo: string]: string } = {
  [ModoFacturacion.TODAS]: 'Toda venta con punto de venta se factura.',
  [ModoFacturacion.INTERVALO]: 'Una de cada N + 1 ventas se factura.',
  [ModoFacturacion.A_PEDIDO]: 'Nunca se factura sola: solo cuando el cliente la pide.'
};

/**
 * ABM de la política de facturación automática del filial (issue filial #127). Una fila global y
 * overrides por sucursal. Sin filas, cada filial sigue con su contador local (facturaCountDown).
 */
@Component({
  selector: 'app-configuracion-facturacion-dialog',
  templateUrl: './configuracion-facturacion-dialog.component.html',
  styleUrls: ['./configuracion-facturacion-dialog.component.scss']
})
export class ConfiguracionFacturacionDialogComponent implements OnInit {

  readonly modos = [
    { value: ModoFacturacion.TODAS, label: MODO_LABELS[ModoFacturacion.TODAS] },
    { value: ModoFacturacion.INTERVALO, label: MODO_LABELS[ModoFacturacion.INTERVALO] },
    { value: ModoFacturacion.A_PEDIDO, label: MODO_LABELS[ModoFacturacion.A_PEDIDO] }
  ];

  filas: FilaConfiguracion[] = [];
  sucursales: Sucursal[] = [];
  editandoId: number = null;
  esIntervalo = true;
  isLoading = true;
  // Textos de ayuda del formulario, recalculados en los eventos: el template no llama funciones.
  modoHint = MODO_HINTS[ModoFacturacion.INTERVALO];
  intervaloHint = '';
  respetaHint = '';
  /** El central de este canal no tiene la función todavía (desktop más nuevo que su backend). */
  sinSoporte = false;

  form = new FormGroup({
    sucursalId: new FormControl<number>(null),
    modo: new FormControl<ModoFacturacion>(ModoFacturacion.INTERVALO, Validators.required),
    ventasSinFactura: new FormControl<number>(0, [Validators.required, Validators.min(0)]),
    ventaTicketRespetaPolitica: new FormControl<boolean>(false)
  });

  constructor(
    public dialogRef: MatDialogRef<ConfiguracionFacturacionDialogComponent>,
    private configuracionService: ConfiguracionFacturacionService,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.actualizarHints();
    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      this.sucursales = res != null ? res : [];
    });
    this.cargar();
  }

  private cargar(): void {
    this.isLoading = true;
    this.configuracionService.onGetConfiguraciones().subscribe({
      next: (res) => {
        // onCustomQuery emite null ante un error (por ejemplo, el central no conoce la query);
        // una lista vacía llega como []. Sin esto, el error se veria igual que "sin configuración".
        this.sinSoporte = res == null;
        const configs = (res != null ? res : []).map((r) => Object.assign(new ConfiguracionFacturacion(), r));
        // La global primero; después las sucursales por nombre.
        configs.sort((a, b) => {
          if (a.sucursal == null) return -1;
          if (b.sucursal == null) return 1;
          return (a.sucursal.nombre || '').localeCompare(b.sucursal.nombre || '');
        });
        this.filas = configs.map((c) => this.toFila(c));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.sinSoporte = true;
        this.notificacionService.openAlgoSalioMal('Error al cargar la configuración de facturación');
      }
    });
  }

  private toFila(c: ConfiguracionFacturacion): FilaConfiguracion {
    return {
      config: c,
      sucursalNombre: c.sucursal != null ? c.sucursal.nombre : 'GLOBAL (TODAS LAS SUCURSALES)',
      modoLabel: c.modo === ModoFacturacion.INTERVALO
        ? `1 DE CADA ${(c.ventasSinFactura ?? 0) + 1}`
        : (MODO_LABELS[c.modo] || c.modo),
      modoClase: MODO_CLASES[c.modo] || 'chip-siempre',
      respetaLabel: c.ventaTicketRespetaPolitica ? 'SEGÚN LA POLÍTICA' : 'FACTURA SIEMPRE',
      modificadoPor: c.usuarioNickname || '-',
      modificadoEn: c.modificadoEn
    };
  }

  onModoChange(): void {
    this.esIntervalo = this.form.controls.modo.value === ModoFacturacion.INTERVALO;
    if (this.esIntervalo) {
      this.form.controls.ventasSinFactura.enable();
    } else {
      this.form.controls.ventasSinFactura.disable();
    }
    this.actualizarHints();
  }

  onIntervaloChange(): void {
    this.actualizarHints();
  }

  onRespetaChange(): void {
    this.actualizarHints();
  }

  private actualizarHints(): void {
    const modo = this.form.controls.modo.value;
    this.modoHint = MODO_HINTS[modo] || '';
    const n = this.form.controls.ventasSinFactura.value;
    this.intervaloHint = n != null && n >= 0
      ? (n === 0 ? 'Con 0 se factura el 100%.' : `Factura 1 de cada ${n + 1}.`)
      : '';
    this.respetaHint = this.form.controls.ventaTicketRespetaPolitica.value === true
      ? 'Encendido: esos botones solo facturan si el modo lo indica.'
      : 'Apagado: esos botones facturan siempre, como hasta ahora.';
  }

  onEditar(fila: FilaConfiguracion): void {
    const c = fila.config;
    this.editandoId = c.id;
    this.form.setValue({
      sucursalId: c.sucursal?.id ?? null,
      modo: c.modo,
      ventasSinFactura: c.ventasSinFactura ?? 0,
      ventaTicketRespetaPolitica: c.ventaTicketRespetaPolitica === true
    });
    this.onModoChange();
  }

  onNuevo(): void {
    this.editandoId = null;
    this.form.reset({
      sucursalId: null,
      modo: ModoFacturacion.INTERVALO,
      ventasSinFactura: 0,
      ventaTicketRespetaPolitica: false
    });
    this.onModoChange();
  }

  onGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const input = new ConfiguracionFacturacionInput();
    input.id = this.editandoId;
    input.sucursalId = v.sucursalId;
    input.modo = v.modo;
    input.ventasSinFactura = this.esIntervalo ? v.ventasSinFactura : 0;
    input.ventaTicketRespetaPolitica = v.ventaTicketRespetaPolitica === true;
    this.configuracionService.onSaveConfiguracion(input).subscribe({
      next: (res) => {
        if (res != null) {
          this.notificacionService.openSucess('Configuración de facturación guardada');
          this.onNuevo();
          this.cargar();
        }
      },
      error: () => {
        this.notificacionService.openAlgoSalioMal('Error al guardar la configuración de facturación');
      }
    });
  }

  onEliminar(fila: FilaConfiguracion): void {
    const mensaje = fila.config.sucursal != null
      ? `${fila.sucursalNombre} vuelve a usar la configuración global. ¿Continuar?`
      : 'Las sucursales sin configuración propia vuelven a su contador local (facturaCountDown). ¿Continuar?';
    this.configuracionService.onDeleteConfiguracion(fila.config.id, mensaje).subscribe((res) => {
      if (res) {
        if (this.editandoId === fila.config.id) {
          this.onNuevo();
        }
        this.cargar();
      }
    });
  }

  onCerrar(): void {
    this.dialogRef.close();
  }
}
