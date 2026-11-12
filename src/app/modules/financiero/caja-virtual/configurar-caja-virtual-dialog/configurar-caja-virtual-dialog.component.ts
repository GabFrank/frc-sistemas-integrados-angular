import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';
import {
  CajaVirtual, CajaVirtualConfiguracion, CajaVirtualConfiguracionInput, CajaVirtualOrdenes, CajaVirtualSaldoItem, ordenarSegun, ordenarSucursales, parseListaJson
} from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { CuentaBancariaService } from '../../cuenta-bancaria/cuenta-bancaria.service';
import { CuentaBancaria } from '../../cuenta-bancaria/cuenta-bancaria.model';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { TIPOS_OPERACION_FINANCIERA, TipoOperacionFinanciera } from '../../operacion-financiera/operacion-financiera.model';

interface CuentaOpcion {
  cuenta: CuentaBancaria;
  visible: boolean;
}

interface MonedaOpcion { id: number; nombre: string; simbolo: string; }
interface SucursalOpcion { id: number; nombre: string; }
interface OperacionOpcion { value: TipoOperacionFinanciera; label: string; icono: string; visible: boolean; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-configurar-caja-virtual-dialog',
  templateUrl: './configurar-caja-virtual-dialog.component.html',
  styleUrls: ['./configurar-caja-virtual-dialog.component.scss']
})
export class ConfigurarCajaVirtualDialogComponent implements OnInit {

  cajaVirtual: CajaVirtual;
  cuentas: CuentaOpcion[] = [];
  monedas: MonedaOpcion[] = [];
  sucursales: SucursalOpcion[] = [];
  operaciones: OperacionOpcion[] = [];
  mostrarCpp = false;
  mostrarCpc = false;
  operacionesHabilitado = true;

  loading = false;
  /** La carga falló: no se muestra ni se puede guardar una configuración armada sin datos del servidor. */
  cargaFallo = false;
  guardando = false;
  /**
   * Las monedas o sucursales no cargaron: sus listas no se muestran y su orden no se manda (null = el central no
   * lo pisa). Así un fallo parcial no borra un orden ya guardado.
   */
  monedasNoCargaron = false;
  sucursalesNoCargaron = false;
  /** El central no tiene los órdenes (versión vieja o error): las tres listas se ocultan y no se mandan. */
  ordenesNoDisponibles = false;

  constructor(
    private dialogRef: MatDialogRef<ConfigurarCajaVirtualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cajaVirtual: CajaVirtual },
    private cajaVirtualService: CajaVirtualService,
    private cuentaBancariaService: CuentaBancariaService,
    private sucursalService: SucursalService,
    private notificacion: NotificacionSnackbarService,
  ) {
    this.cajaVirtual = data?.cajaVirtual;
  }

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      cuentas: this.cuentaBancariaService.onGetAllOperables(PROPAGAR_ERROR_DE_RED,
        { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }),
      config: this.cajaVirtualService.onGetConfiguracion(this.cajaVirtual.id),
      // Las tres de abajo nunca cortan la carga: si fallan, solo se oculta su lista.
      ordenes: this.cajaVirtualService.onGetOrdenes(this.cajaVirtual.id),
      saldos: this.cajaVirtualService.onGetSaldos(this.cajaVirtual.id, true).pipe(catchError(() => of(null))),
      sucursales: this.sucursalService.onGetAllSucursalesByActive(true, true).pipe(catchError(() => of(null))),
    }).pipe(untilDestroyed(this)).subscribe({
      next: ({ cuentas, config, ordenes, saldos, sucursales }) => {
        this.loading = false;
        // Sin cuentas (error) Guardar pisaría las cuentas visibles y el orden con una lista vacía. config null
        // es «caja sin configuración», legítimo (#390).
        if (cuentas == null) { this.noCargo(); return; }
        this.aplicarConfig(cuentas, config);
        this.aplicarOrdenes(ordenes, saldos, sucursales);
      },
      error: () => { this.loading = false; this.noCargo(); }
    });
  }

  private noCargo() {
    this.cargaFallo = true;
    this.notificacion.openWarn('No se pudo cargar la configuración de la caja: cerrá y volvé a abrir para reintentar.', 5);
  }

  private aplicarConfig(cuentas: CuentaBancaria[], config: CajaVirtualConfiguracion) {
    const visiblesIds = new Set<number>((config?.cuentasBancariasVisibles || []).map(c => c.id));
    const orden = parseListaJson<any>(config?.cuentasBancariasOrden).map(x => Number(x));
    const opciones: CuentaOpcion[] = cuentas.map(c => ({ cuenta: c, visible: visiblesIds.has(c.id) }));
    // Ordenar según el orden persistido; las que no están, al final por id.
    this.cuentas = ordenarSegun(opciones, o => o.cuenta.id, orden, (a, b) => a.cuenta.id - b.cuenta.id);
    this.mostrarCpp = !!config?.mostrarCuentasPorPagar;
    this.mostrarCpc = !!config?.mostrarCuentasPorCobrar;
    this.operacionesHabilitado = config ? (config.operacionesFinancierasHabilitado !== false) : true;
  }

  private aplicarOrdenes(ordenes: CajaVirtualOrdenes, saldos: CajaVirtualSaldoItem[], sucursales: Sucursal[]) {
    if (ordenes.noDisponible) {
      this.ordenesNoDisponibles = true;
      return;
    }
    // Monedas: las que tiene la caja (las de sus cards de saldo).
    if (saldos == null) {
      this.monedasNoCargaron = true;
    } else {
      const monedas: MonedaOpcion[] = saldos.filter(s => s.moneda?.id != null).map(s => ({
        id: Number(s.moneda.id), nombre: s.moneda.denominacion, simbolo: s.moneda.simbolo
      }));
      const orden = parseListaJson<any>(ordenes.monedasOrden).map(x => Number(x));
      this.monedas = ordenarSegun(monedas, m => m.id, orden, (a, b) => a.id - b.id);
    }

    // Sucursales: todas las activas, menos las técnicas (0 y 999), como en el alta de caja.
    if (sucursales == null) {
      this.sucursalesNoCargaron = true;
    } else {
      const lista: SucursalOpcion[] = sucursales.filter(s => s.id != 0 && s.id != 999)
        .map(s => ({ id: Number(s.id), nombre: s.nombre }));
      const orden = parseListaJson<any>(ordenes.sucursalesOrden).map(x => Number(x));
      this.sucursales = ordenarSucursales(lista, orden);
    }

    const ocultas = new Set(parseListaJson<string>(ordenes.operacionesFinancierasOcultas));
    const opciones: OperacionOpcion[] = TIPOS_OPERACION_FINANCIERA.map(t => ({
      value: t.value, label: t.label, icono: t.icono, visible: !ocultas.has(t.value)
    }));
    // Sin orden guardado queda el de siempre (el índice en TIPOS_OPERACION_FINANCIERA).
    const base = TIPOS_OPERACION_FINANCIERA.map(t => t.value);
    this.operaciones = ordenarSegun(opciones, o => o.value, parseListaJson<TipoOperacionFinanciera>(ordenes.operacionesFinancierasOrden),
      (a, b) => base.indexOf(a.value) - base.indexOf(b.value));
  }

  drop(event: CdkDragDrop<CuentaOpcion[]>) {
    moveItemInArray(this.cuentas, event.previousIndex, event.currentIndex);
  }

  dropMoneda(event: CdkDragDrop<MonedaOpcion[]>) {
    moveItemInArray(this.monedas, event.previousIndex, event.currentIndex);
  }

  dropSucursal(event: CdkDragDrop<SucursalOpcion[]>) {
    moveItemInArray(this.sucursales, event.previousIndex, event.currentIndex);
  }

  dropOperacion(event: CdkDragDrop<OperacionOpcion[]>) {
    moveItemInArray(this.operaciones, event.previousIndex, event.currentIndex);
  }

  toggleTodas(valor: boolean) {
    this.cuentas.forEach(c => (c.visible = valor));
  }

  guardar() {
    this.guardando = true;
    const visibles = this.cuentas.filter(c => c.visible);
    const ids = visibles.map(c => c.cuenta.id);
    this.cajaVirtualService.onSaveConfiguracion({
      cajaVirtualId: this.cajaVirtual.id,
      mostrarCuentasPorPagar: this.mostrarCpp,
      mostrarCuentasPorCobrar: this.mostrarCpc,
      operacionesFinancierasHabilitado: this.operacionesHabilitado,
      cuentasBancariasVisiblesIds: ids,
      cuentasBancariasOrden: JSON.stringify(ids),
      ...this.ordenesParaGuardar(),
    }, { avisarExito: false }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.guardando = false;
        if (res != null) {
          this.notificacion.notification$.next({ texto: 'Configuración guardada', color: NotificacionColor.success, duracion: 3 });
          this.dialogRef.close(true);
        }
      },
      // El aviso de error lo da onSaveCustom.
      error: () => {
        this.guardando = false;
      }
    });
  }

  /**
   * Los órdenes nuevos, solo si el central los conoce: a un central viejo, un campo de más en el input le hace
   * rechazar el guardado entero. null = no tocar lo guardado (la lista no cargó).
   */
  private ordenesParaGuardar(): Partial<CajaVirtualConfiguracionInput> {
    if (this.ordenesNoDisponibles) return {};
    return {
      monedasOrden: this.monedasNoCargaron ? null : JSON.stringify(this.monedas.map(m => m.id)),
      sucursalesOrden: this.sucursalesNoCargaron ? null : JSON.stringify(this.sucursales.map(s => s.id)),
      operacionesFinancierasOrden: JSON.stringify(this.operaciones.map(o => o.value)),
      operacionesFinancierasOcultas: JSON.stringify(this.operaciones.filter(o => !o.visible).map(o => o.value)),
    };
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
