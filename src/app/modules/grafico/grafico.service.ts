import { inject, Injectable } from '@angular/core';
import { GenericCrudService } from '../../generics/generic-crud.service';
import { VentaPorPeriodoGQL } from './graphql/venta-por-periodo.gql';

import { FormaPagoEstadisticasConFiltrosGQL } from './graphql/forma-pago-estadisticas-con-filtros.gql';
import { ProductosMasVendidosGQL } from './graphql/productos-mas-vendidos.gql';
import { VentasPorFuncionarioGQL } from './graphql/ventas-por-funcionario.gql';
import { SucursalService } from '../empresarial/sucursal/sucursal.service';
import { FamiliaService } from '../productos/familia/familia.service';
import { Observable } from 'rxjs';
import { VentaPorPeriodo } from './models/venta-por-periodo.model';
import { Sucursal } from '../empresarial/sucursal/sucursal.model';
import { Familia } from '../productos/familia/familia.model';

@Injectable({
  providedIn: 'root'
})
export class GraficoService {
  private genericService = inject(GenericCrudService);
  private sucursalService = inject(SucursalService);
  private familiaService = inject(FamiliaService);
  private ventaPorPeriodoGQL = inject(VentaPorPeriodoGQL);

  private formaPagoGQL = inject(FormaPagoEstadisticasConFiltrosGQL);
  private productosMasVendidosGQL = inject(ProductosMasVendidosGQL);
  private ventasPorFuncionarioGQL = inject(VentasPorFuncionarioGQL);

  obtenerSucursales(): Observable<Sucursal[]> {
    return this.sucursalService.onGetAllSucursales(true);
  }

  obtenerFamilias(): Observable<Familia[]> {
    return this.familiaService.familiaBS.asObservable();
  }

  obtenerVentasPorPeriodo(inicio: string, fin: string, sucId?: number): Observable<VentaPorPeriodo[]> {
    return this.genericService.onCustomQuery(
      this.ventaPorPeriodoGQL,
      { inicio, fin, sucId },
      true,
      null,
      true
    );
  }

  obtenerEstadisticasFormaPago(inicio: string, fin: string, sucId?: number): Observable<any[]> {
    return this.genericService.onCustomQuery(
      this.formaPagoGQL,
      { inicio, fin, sucursalId: sucId ? String(sucId) : null },
      true,
      null,
      true
    );
  }

  obtenerProductosMasVendidos(inicio: string, fin: string, sucId?: number, familiaId?: number, limit: number = 10): Observable<any[]> {
    return this.genericService.onCustomQuery(
      this.productosMasVendidosGQL,
      {
        inicio, fin, limit,
        sucursalId: sucId ? String(sucId) : null,
        familiaId: familiaId ? String(familiaId) : null
      },
      true,
      null,
      true

    );
  }

  obtenerVentasPorFuncionario(inicio: string, fin: string, sucId?: number): Observable<any[]> {
    return this.genericService.onCustomQuery(
      this.ventasPorFuncionarioGQL,
      { inicio, fin, sucId: sucId ? String(sucId) : null },
      true,
      null,
      true
    );
  }
}
