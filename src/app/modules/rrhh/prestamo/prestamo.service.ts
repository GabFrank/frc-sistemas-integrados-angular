import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { PrestamosPorFuncionarioGQL } from './graphql/PrestamosPorFuncionario';
import { PrestamosPageGQL } from './graphql/PrestamosPage';
import { PrestamoCuotasGQL } from './graphql/PrestamoCuotas';
import { CrearPrestamoGQL } from './graphql/CrearPrestamo';
import { CobrarCuotaGQL } from './graphql/CobrarCuota';
import { Prestamo, PrestamoCuota } from './prestamo.model';

@Injectable({ providedIn: 'root' })
export class PrestamoService {
  constructor(
    private genericService: GenericCrudService,
    private prestamosPorFuncionarioGQL: PrestamosPorFuncionarioGQL,
    private prestamosPageGQL: PrestamosPageGQL,
    private prestamoCuotasGQL: PrestamoCuotasGQL,
    private crearPrestamoGQL: CrearPrestamoGQL,
    private cobrarCuotaGQL: CobrarCuotaGQL
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

  onCrear(prestamo: any, cajaVirtualId: number, servidor = true): Observable<Prestamo> {
    return this.genericService.onSaveCustom<Prestamo>(this.crearPrestamoGQL, { prestamo, cajaVirtualId }, servidor);
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
