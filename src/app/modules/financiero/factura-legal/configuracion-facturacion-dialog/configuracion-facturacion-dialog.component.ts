import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import {
  AccionConfiguracionFacturacion,
  ConfiguracionFacturacion,
  ConfiguracionFacturacionHistorial,
  ConfiguracionFacturacionInput,
  ModoFacturacion
} from './configuracion-facturacion.model';
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

/** Una fila del historial, ya calculada. */
interface FilaHistorial {
  fecha: Date;
  sucursalNombre: string;
  accionLabel: string;
  accionClase: string;
  modoLabel: string;
  modoClase: string;
  respetaLabel: string;
  activoLabel: string;
  usuario: string;
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

const ACCION_LABELS: { [accion: string]: string } = {
  [AccionConfiguracionFacturacion.CREAR]: 'CREADA',
  [AccionConfiguracionFacturacion.MODIFICAR]: 'MODIFICADA',
  [AccionConfiguracionFacturacion.ACTIVAR]: 'ACTIVADA',
  [AccionConfiguracionFacturacion.DESACTIVAR]: 'DESACTIVADA',
  [AccionConfiguracionFacturacion.ELIMINAR]: 'ELIMINADA'
};

const ACCION_CLASES: { [accion: string]: string } = {
  [AccionConfiguracionFacturacion.CREAR]: 'chip-todas',
  [AccionConfiguracionFacturacion.MODIFICAR]: 'chip-intervalo',
  [AccionConfiguracionFacturacion.ACTIVAR]: 'chip-todas',
  [AccionConfiguracionFacturacion.DESACTIVAR]: 'chip-siempre',
  [AccionConfiguracionFacturacion.ELIMINAR]: 'chip-eliminada'
};

function modoLabel(modo: ModoFacturacion, ventasSinFactura: number): string {
  return modo === ModoFacturacion.INTERVALO
    ? `1 DE CADA ${(ventasSinFactura ?? 0) + 1}`
    : (MODO_LABELS[modo] || modo);
}

/**
 * ABM de la política de facturación automática del filial (issue filial #127). Una fila global y
 * overrides por sucursal, cada una activa o inactiva, más el historial de cambios. Sin filas
 * activas, cada filial sigue con su contador local (facturaCountDown).
 */
@Component({
  selector: 'app-configuracion-facturacion-dialog',
  templateUrl: './configuracion-facturacion-dialog.component.html',
  styleUrls: ['./configuracion-facturacion-dialog.component.scss']
})
export class ConfiguracionFacturacionDialogComponent implements OnInit {

  /** Valor del select para la global: null lo trata Material como "vacío" y no lo muestra. 0 existe. */
  readonly GLOBAL = -1;

  readonly modos = [
    { value: ModoFacturacion.TODAS, label: MODO_LABELS[ModoFacturacion.TODAS] },
    { value: ModoFacturacion.INTERVALO, label: MODO_LABELS[ModoFacturacion.INTERVALO] },
    { value: ModoFacturacion.A_PEDIDO, label: MODO_LABELS[ModoFacturacion.A_PEDIDO] }
  ];

  vista: 'config' | 'historial' = 'config';

  filas: FilaConfiguracion[] = [];
  sucursales: Sucursal[] = [];
  editandoId: number = null;
  esIntervalo = true;
  isLoading = true;
  /** El central de este canal no tiene la función todavía (desktop más nuevo que su backend). */
  sinSoporte = false;
  /** Texto del banner cuando la global falta o está inactiva; vacío si hay global activa. */
  avisoGlobal = '';
  /** Qué rige para una sucursal sin configuración propia activa: se muestra en las confirmaciones. */
  private rigeSinOverride = '';
  haySucursalesActivas = false;
  haySucursalesInactivas = false;

  historial: FilaHistorial[] = [];
  historialError = false;
  historialCargando = false;
  /** null = todas; GLOBAL = solo la global; id = una sucursal. */
  filtroHistorial: number = null;

  // Textos de ayuda del formulario, recalculados en los eventos: el template no llama funciones.
  modoHint = MODO_HINTS[ModoFacturacion.INTERVALO];
  intervaloHint = '';
  respetaHint = '';

  form = new FormGroup({
    sucursalId: new FormControl<number>(-1),
    modo: new FormControl<ModoFacturacion>(ModoFacturacion.INTERVALO, Validators.required),
    ventasSinFactura: new FormControl<number>(0, [Validators.required, Validators.min(0)]),
    ventaTicketRespetaPolitica: new FormControl<boolean>(false)
  });

  constructor(
    public dialogRef: MatDialogRef<ConfiguracionFacturacionDialogComponent>,
    private configuracionService: ConfiguracionFacturacionService,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService
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
        // una lista vacía llega como []. Sin esto, el error se vería igual que "sin configuración".
        this.sinSoporte = res == null;
        const configs = (res != null ? res : []).map((r) => Object.assign(new ConfiguracionFacturacion(), r));
        // La global primero; después las sucursales por nombre.
        configs.sort((a, b) => {
          if (a.sucursal == null) return -1;
          if (b.sucursal == null) return 1;
          return (a.sucursal.nombre || '').localeCompare(b.sucursal.nombre || '');
        });
        this.filas = configs.map((c) => this.toFila(c));
        this.calcularEstado(configs);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.sinSoporte = true;
        this.notificacionService.openAlgoSalioMal('Error al cargar la configuración de facturación');
      }
    });
  }

  private calcularEstado(configs: ConfiguracionFacturacion[]): void {
    const global = configs.find((c) => c.sucursal == null);
    const sucursales = configs.filter((c) => c.sucursal != null);
    this.haySucursalesActivas = sucursales.some((c) => c.activo !== false);
    this.haySucursalesInactivas = sucursales.some((c) => c.activo === false);
    if (global != null && global.activo !== false) {
      this.avisoGlobal = '';
      this.rigeSinOverride = `la configuración global (${modoLabel(global.modo, global.ventasSinFactura)})`;
    } else {
      this.avisoGlobal = global == null
        ? 'No hay configuración global: las sucursales sin configuración propia activa usan el contador local de su servidor.'
        : 'La configuración global está inactiva: las sucursales sin configuración propia activa usan el contador local de su servidor.';
      this.rigeSinOverride = 'el contador local de cada servidor (facturaCountDown)';
    }
  }

  private toFila(c: ConfiguracionFacturacion): FilaConfiguracion {
    return {
      config: c,
      sucursalNombre: c.sucursal != null ? c.sucursal.nombre : 'GLOBAL (TODAS LAS SUCURSALES)',
      modoLabel: modoLabel(c.modo, c.ventasSinFactura),
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
      sucursalId: c.sucursal?.id ?? this.GLOBAL,
      modo: c.modo,
      ventasSinFactura: c.ventasSinFactura ?? 0,
      ventaTicketRespetaPolitica: c.ventaTicketRespetaPolitica === true
    });
    this.onModoChange();
  }

  onNuevo(): void {
    this.editandoId = null;
    this.form.reset({
      sucursalId: this.GLOBAL,
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
    input.sucursalId = v.sucursalId === this.GLOBAL ? null : v.sucursalId;
    input.modo = v.modo;
    input.ventasSinFactura = this.esIntervalo ? v.ventasSinFactura : 0;
    input.ventaTicketRespetaPolitica = v.ventaTicketRespetaPolitica === true;
    // Sin activo: al crear queda activa, y al editar el central conserva el que tenía.
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

  /** El switch de la fila: guarda la misma configuración con el activo invertido. */
  onToggleActivo(fila: FilaConfiguracion): void {
    const input = fila.config.toInput();
    input.activo = fila.config.activo === false;
    this.configuracionService.onSaveConfiguracion(input).subscribe({
      next: () => this.cargar(),
      error: () => this.cargar()
    });
  }

  onSetActivoSucursales(activo: boolean): void {
    const titulo = activo ? 'ACTIVAR SUCURSALES' : 'DESACTIVAR SUCURSALES';
    const mensaje = activo
      ? 'Todas las sucursales vuelven a usar su configuración propia.'
      : `Todas las sucursales pasan a seguir ${this.rigeSinOverride}. Cada una conserva sus valores para reactivarla después.`;
    this.dialogosService.confirm(titulo, mensaje).subscribe((ok) => {
      if (!ok) return;
      this.configuracionService.onSetActivoSucursales(activo).subscribe((cambiadas) => {
        if (cambiadas != null) {
          this.notificacionService.openSucess(`${cambiadas} configuraciones ${activo ? 'activadas' : 'desactivadas'}`);
          this.cargar();
        }
      });
    });
  }

  onEliminar(fila: FilaConfiguracion): void {
    const mensaje = fila.config.sucursal != null
      ? `${fila.sucursalNombre} pasa a seguir ${this.rigeSinOverride}. Si solo querés pausarla, desactivala. ¿Continuar?`
      : 'Las sucursales sin configuración propia activa vuelven a su contador local (facturaCountDown). ¿Continuar?';
    this.configuracionService.onDeleteConfiguracion(fila.config.id, mensaje).subscribe((res) => {
      if (res) {
        if (this.editandoId === fila.config.id) {
          this.onNuevo();
        }
        this.cargar();
      }
    });
  }

  onVerConfiguracion(): void {
    this.vista = 'config';
  }

  onVerHistorial(): void {
    this.vista = 'historial';
    this.cargarHistorial();
  }

  onFiltroHistorialChange(): void {
    this.cargarHistorial();
  }

  private cargarHistorial(): void {
    this.historialCargando = true;
    this.configuracionService.onGetHistorial(this.filtroHistorial).subscribe({
      next: (res) => {
        // null = error (distinto de "sin cambios", que llega como []).
        this.historialError = res == null;
        this.historial = (res != null ? res : []).map((h) => this.toFilaHistorial(h));
        this.historialCargando = false;
      },
      error: () => {
        this.historialError = true;
        this.historialCargando = false;
      }
    });
  }

  private toFilaHistorial(h: ConfiguracionFacturacionHistorial): FilaHistorial {
    return {
      fecha: h.creadoEn,
      sucursalNombre: h.sucursal != null ? h.sucursal.nombre : 'GLOBAL',
      accionLabel: ACCION_LABELS[h.accion] || h.accion,
      accionClase: ACCION_CLASES[h.accion] || 'chip-siempre',
      modoLabel: modoLabel(h.modo, h.ventasSinFactura),
      modoClase: MODO_CLASES[h.modo] || 'chip-siempre',
      respetaLabel: h.ventaTicketRespetaPolitica ? 'SEGÚN LA POLÍTICA' : 'FACTURA SIEMPRE',
      activoLabel: h.activo ? 'ACTIVA' : 'INACTIVA',
      usuario: h.usuarioNickname || '-'
    };
  }

  onCerrar(): void {
    this.dialogRef.close();
  }
}
