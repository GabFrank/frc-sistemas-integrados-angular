import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { PrestamosPorFuncionarioGQL } from './graphql/PrestamosPorFuncionario';
import { PrestamosPageGQL } from './graphql/PrestamosPage';
import { PrestamoCuotasGQL } from './graphql/PrestamoCuotas';
import { CrearPrestamoGQL, CrearPrestamoSinClaveGQL } from './graphql/CrearPrestamo';
import { centralNoConoceLaClave, conClaveSiElCentralLaConoce, OpcionesDePedidoConClave } from '../../../commons/core/utils/claveIdempotencia';
import { CobrarCuotaGQL } from './graphql/CobrarCuota';
import { Prestamo, PrestamoCuota } from './prestamo.model';

/** Un préstamo listo para enviar: las variables de la mutation y la clave de ese intento. */
export interface PedidoDePrestamo {
  prestamo: any;
  cajaVirtualId: number;
  claveIdempotencia: string;
}

@Injectable({ providedIn: 'root' })
export class PrestamoService {
  constructor(
    private genericService: GenericCrudService,
    private prestamosPorFuncionarioGQL: PrestamosPorFuncionarioGQL,
    private prestamosPageGQL: PrestamosPageGQL,
    private prestamoCuotasGQL: PrestamoCuotasGQL,
    private crearPrestamoGQL: CrearPrestamoGQL,
    private cobrarCuotaGQL: CobrarCuotaGQL,
    private crearPrestamoSinClaveGQL: CrearPrestamoSinClaveGQL
  ) { }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.prestamosPorFuncionarioGQL, { funcionarioId }, servidor,
      PROPAGAR_ERROR_DE_RED, undefined, { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true });
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, funcionarioId?: number, estado?: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.prestamosPageGQL, { page, size, funcionarioId, estado }, servidor);
  }

  onGetCuotas(prestamoId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.prestamoCuotasGQL, { prestamoId }, servidor, PROPAGAR_ERROR_DE_RED,
      undefined, { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true });
  }

  /**
   * Crea el préstamo y lo desembolsa. El pedido va tal como viene, con su clave: un reintento manda exactamente
   * lo mismo y el central no desembolsa dos veces. `opciones.sinClave` avisa si el central no conoce la clave.
   */
  onCrear(pedido: PedidoDePrestamo, opciones?: OpcionesDePedidoConClave): Observable<Prestamo> {
    const { claveIdempotencia, ...variables } = pedido;
    return conClaveSiElCentralLaConoce(conClave => conClave
      ? this.genericService.onSaveCustom<Prestamo>(this.crearPrestamoGQL, pedido, true,
          { silenciarRechazo: centralNoConoceLaClave })
      : this.genericService.onSaveCustom<Prestamo>(this.crearPrestamoSinClaveGQL, variables, true),
      opciones?.sinClave, !opciones?.esReenvio);
  }

  /**
   * `montoPagadoEsperado` es el monto pagado que mostraba la pantalla: si la cuota cambió desde entonces
   * (un reintento, otro cobro), el central rechaza el cobro sin tocar la caja.
   */
  onCobrarCuota(cuotaId: number, cajaVirtualId: number, montoPago: number, montoPagadoEsperado: number,
                servidor = true): Observable<PrestamoCuota> {
    return this.genericService.onSaveCustom<PrestamoCuota>(this.cobrarCuotaGQL,
      { cuotaId, cajaVirtualId, montoPago, montoPagadoEsperado }, servidor);
  }
}
