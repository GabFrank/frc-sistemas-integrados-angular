import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
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
    return this.genericService.onCustomQuery(this.prestamosPorFuncionarioGQL, { funcionarioId }, servidor);
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, funcionarioId?: number, estado?: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.prestamosPageGQL, { page, size, funcionarioId, estado }, servidor);
  }

  onGetCuotas(prestamoId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.prestamoCuotasGQL, { prestamoId }, servidor);
  }

  onCrear(prestamo: any, cajaVirtualId: number, servidor = true): Observable<Prestamo> {
    return this.genericService.onSaveCustom<Prestamo>(this.crearPrestamoGQL, { prestamo, cajaVirtualId }, servidor);
  }

  onCobrarCuota(cuotaId: number, cajaVirtualId: number, montoPago: number, servidor = true): Observable<PrestamoCuota> {
    return this.genericService.onSaveCustom<PrestamoCuota>(this.cobrarCuotaGQL, { cuotaId, cajaVirtualId, montoPago }, servidor);
  }
}
