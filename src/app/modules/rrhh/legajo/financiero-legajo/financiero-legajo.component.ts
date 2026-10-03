import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { catchError, of, timeout } from 'rxjs';

import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { ValeService } from '../../vale/vale.service';
import { PrestamoService } from '../../prestamo/prestamo.service';
import { PenalizacionService } from '../../penalizacion/penalizacion.service';
import { VentaCreditoService } from '../../../financiero/venta-credito/venta-credito.service';
import { ClienteService } from '../../../personas/clientes/cliente.service';
import { PROPAGAR_ERROR_DE_RED } from '../../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';

/** onGetById (cliente por persona) no emite si falla: se corta un poco despues del timeout del link. */
const CORTE_CLIENTE_MS = TIMEOUT_POR_DEFECTO_MS + 5000;

/**
 * Tab "Financiero" del legajo — VISTA CONSOLIDADA de solo lectura de la deuda del funcionario.
 * No hace CRUD: el alta/cobro de vales, préstamos y penalizaciones vive en sus módulos propios
 * y en la liquidación. Acá solo se agregan las mismas queries por-funcionario que ya usa
 * LiquidacionSueldoService en el backend, más el crédito de convenio (vía el Cliente asociado
 * a la persona del funcionario).
 *
 * Vínculos: Vale/Prestamo/Penalizacion tienen funcionarioId directo. El crédito de convenio
 * (VentaCredito) cuelga del Cliente, así que se resuelve personaId -> Cliente -> ventas a crédito.
 */
@UntilDestroy()
@Component({
  selector: 'app-financiero-legajo',
  templateUrl: './financiero-legajo.component.html',
  styleUrls: ['./financiero-legajo.component.scss']
})
export class FinancieroLegajoComponent implements OnInit, OnChanges {

  @Input() funcionarioId: number;
  @Input() personaId: number;

  // ---- Resumen (precalculado, sin funciones en el template) ----
  creditoLimite = 0;
  creditoSaldo = 0;
  valesPendiente = 0;
  prestamosSaldo = 0;
  prestamosActivos = 0;
  penalizacionesTotal = 0;
  exposicionTotal = 0;

  /**
   * Fuentes que no llegaron (central sin responder o error). Un total en 0 diria «no debe nada»:
   * se muestra «No disponible» y la exposicion lista lo que falta (#390). Se reinician en cada carga.
   */
  valesNoCargados = false;
  prestamosNoCargados = false;
  penalizacionesNoCargadas = false;
  creditoNoCargado = false;
  /** Precalculado para el template: '' si la exposicion esta completa. */
  exposicionFaltante = '';

  // ---- Detalle ----
  vales = new MatTableDataSource<any>([]);
  prestamos = new MatTableDataSource<any>([]);
  penalizaciones = new MatTableDataSource<any>([]);
  creditos = new MatTableDataSource<any>([]);

  valeColumns = ['fecha', 'motivo', 'monto', 'estado', 'observacion'];
  prestamoColumns = ['fechaInicio', 'descripcion', 'montoTotal', 'montoPagado', 'saldo', 'cuotas', 'estado'];
  penalizacionColumns = ['fecha', 'tipo', 'descripcion', 'monto', 'origen'];
  creditoColumns = ['creadoEn', 'venta', 'valorTotal', 'saldoTotal', 'cuotas', 'estado'];

  constructor(
    private valeService: ValeService,
    private prestamoService: PrestamoService,
    private penalizacionService: PenalizacionService,
    private ventaCreditoService: VentaCreditoService,
    private clienteService: ClienteService
  ) { }

  ngOnInit(): void {
    this.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const fCambio = changes['funcionarioId'] && !changes['funcionarioId'].firstChange;
    const pCambio = changes['personaId'] && !changes['personaId'].firstChange;
    if (fCambio || pCambio) { this.cargar(); }
  }

  private cargar(): void {
    if (this.funcionarioId == null) { return; }
    this.valesNoCargados = false;
    this.prestamosNoCargados = false;
    this.penalizacionesNoCargadas = false;
    this.creditoNoCargado = false;
    this.recomputarExposicion();
    this.cargarVales();
    this.cargarPrestamos();
    this.cargarPenalizaciones();
    this.cargarCredito();
  }

  private cargarVales(): void {
    this.valeService.onGetPorFuncionario(this.funcionarioId).pipe(untilDestroyed(this)).subscribe({
      next: (res: any[]) => {
        this.valesNoCargados = res == null;
        const list = res || [];
        this.vales.data = list;
        // Pendiente de descontar = confirmados que aún no entraron a una liquidación. En un vale en
        // cuotas cuenta solo lo que falta (saldoPendiente lo calcula el backend).
        this.valesPendiente = list
          .filter(v => v.estado === 'CONFIRMADO')
          .reduce((acc, v) => acc + (+v.saldoPendiente || 0), 0);
        this.recomputarExposicion();
      },
      error: () => { this.valesNoCargados = true; this.recomputarExposicion(); }
    });
  }

  private cargarPrestamos(): void {
    this.prestamoService.onGetPorFuncionario(this.funcionarioId).pipe(untilDestroyed(this)).subscribe({
      next: (res: any[]) => {
        this.prestamosNoCargados = res == null;
        const list = (res || []).map(p => ({
          ...p,
          _saldo: (+p.montoTotal || 0) - (+p.montoPagado || 0)
        }));
        this.prestamos.data = list;
        const activos = list.filter(p => p.estado === 'ACTIVO');
        this.prestamosActivos = activos.length;
        this.prestamosSaldo = activos.reduce((acc, p) => acc + (p._saldo || 0), 0);
        this.recomputarExposicion();
      },
      error: () => { this.prestamosNoCargados = true; this.recomputarExposicion(); }
    });
  }

  private cargarPenalizaciones(): void {
    // Rango amplio (5 años) para traer el histórico; el backend exige desde/hasta.
    const hasta = dateToString(new Date(), 'yyyy-MM-dd');
    const desdeDate = new Date();
    desdeDate.setFullYear(desdeDate.getFullYear() - 5);
    const desde = dateToString(desdeDate, 'yyyy-MM-dd');
    this.penalizacionService.onGetPorFuncionarioYRango(this.funcionarioId, desde, hasta)
      .pipe(untilDestroyed(this)).subscribe({
        next: (res: any[]) => {
          this.penalizacionesNoCargadas = res == null;
          const list = (res || []).filter(p => !p.anulada);
          this.penalizaciones.data = list;
          this.penalizacionesTotal = list.reduce((acc, p) => acc + (+p.monto || 0), 0);
        },
        error: () => { this.penalizacionesNoCargadas = true; }
      });
  }

  private cargarCredito(): void {
    // Sin esto, al pasar a un funcionario sin cliente quedaba el crédito del anterior.
    this.creditoLimite = 0;
    this.creditoSaldo = 0;
    this.creditos.data = [];
    if (this.personaId == null) { return; }
    // Sin cliente (null) no hay crédito: es legítimo. Sin respuesta, el crédito no se conoce.
    this.clienteService.onGetByPersonaId(this.personaId).pipe(
      timeout(CORTE_CLIENTE_MS),
      catchError(() => { this.creditoNoCargado = true; this.recomputarExposicion(); return of(undefined); }),
      untilDestroyed(this)
    ).subscribe((cli: any) => {
      if (cli == null) { return; }
      this.creditoLimite = +cli.credito || 0;
      this.ventaCreditoService.onGetPorCliente(cli.id, null, null, null, null, PROPAGAR_ERROR_DE_RED,
        { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true })
        .pipe(untilDestroyed(this)).subscribe({
          next: (res: any[]) => {
            this.creditoNoCargado = res == null;
            const list = res || [];
            this.creditos.data = list;
            // Saldo vigente = lo aún adeudado (abierto / en mora / incobrable).
            this.creditoSaldo = list
              .filter(vc => vc.estado === 'ABIERTO' || vc.estado === 'EN_MORA' || vc.estado === 'INCOBRABLE')
              .reduce((acc, vc) => acc + (+vc.saldoTotal || 0), 0);
            this.recomputarExposicion();
          },
          error: () => { this.creditoNoCargado = true; this.recomputarExposicion(); }
        });
    });
  }

  /** Exposición = deuda pendiente hacia adelante (crédito + vales + préstamos). Las penalizaciones
   *  ya son descuentos puntuales, no deuda futura, por eso no entran acá. */
  private recomputarExposicion(): void {
    this.exposicionTotal = (this.creditoSaldo || 0) + (this.valesPendiente || 0) + (this.prestamosSaldo || 0);
    const faltan = [
      this.creditoNoCargado ? 'crédito' : null,
      this.valesNoCargados ? 'vales' : null,
      this.prestamosNoCargados ? 'préstamos' : null,
    ].filter(f => f != null);
    this.exposicionFaltante = faltan.length > 0 ? 'No cargaron: ' + faltan.join(', ') : '';
  }
}
