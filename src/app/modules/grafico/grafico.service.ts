import { inject, Injectable } from '@angular/core';
import { GenericCrudService } from '../../generics/generic-crud.service';
import { VentaPorPeriodoGQL } from './graphql/venta-por-periodo.gql';
import { ProductosMasVendidosGQL } from './graphql/productos-mas-vendidos.gql';
import { SucursalService } from '../empresarial/sucursal/sucursal.service';
import { FamiliaService } from '../productos/familia/familia.service';
import { Observable } from 'rxjs';
import { VentaPorPeriodo } from './venta-sucursal/venta-por-periodo.model';
import { Sucursal } from '../empresarial/sucursal/sucursal.model';
import { Familia } from '../productos/familia/familia.model';
import { VentasPorFuncionarioMultiGQL } from './graphql/ventas-por-funcionario-multi.gql';
import { FormaPagoEstadisticasMultiGQL } from './graphql/forma-pago-estadisticas-multi.gql';
import { GastosPorCategoriaMultiGQL } from './graphql/gastos-por-categoria-multi.gql';
import { VentasPorSucursalMultiGQL } from './graphql/ventas-por-sucursal-multi.gql';
import { ProductosMasVendidosMultiGQL } from './graphql/productos-mas-vendidos-multi.gql';
import { IngresosGastosPorMesMultiGQL } from './graphql/ingresos-gastos-por-mes-multi.gql';
import { VentasPorHoraMultiGQL } from './graphql/ventas-por-hora-multi.gql';
import { PeriodoGraficoInput } from './utils/grafico-periodo.model';
import { VentasProductoPorDiaGQL } from './graphql/ventas-producto-por-dia.gql';
import { VentasProductoPorMesGQL } from './graphql/ventas-producto-por-mes.gql';
import { ComprasProductoPorDiaGQL } from './graphql/compras-producto-por-dia.gql';
import { ComprasProductoPorMesGQL } from './graphql/compras-producto-por-mes.gql';
import { ProductoVentaPorPeriodo } from './producto-vendido/interfaces/producto-venta-periodo.model';
import { ProductoCompraPorPeriodo } from './producto-vendido/interfaces/producto-compra-periodo.model';
import { FormaPagoEstadistica } from './forma-pago/interfaces/forma-pago-estadistica.model';
import { ProductoVendidoEstadistica } from './producto-vendido/interfaces/producto-vendido-estadistica.model';
import { VentaFuncionarioItem } from './venta-funcionario/interfaces/venta-funcionario-item.model';
import { GastoCategoriaItem } from './gasto-categoria/interfaces/gasto-categoria-item.model';
import { VentaSucursalItem } from './venta-sucursal/venta-sucursal-item.model';
import { IngresoGastoSerieGrafico } from './ingreso-gasto/interfaces/ingreso-gasto-serie-grafico.model';
import { VentasPorHoraSerieGrafico } from './ventas-dias/interfaces/ventas-por-hora-serie-grafico.model';

@Injectable({
  providedIn: 'root'
})
export class GraficoService {
  private genericService = inject(GenericCrudService);
  private sucursalService = inject(SucursalService);
  private familiaService = inject(FamiliaService);
  private ventaPorPeriodoGQL = inject(VentaPorPeriodoGQL);
  private productosMasVendidosGQL = inject(ProductosMasVendidosGQL);
  private ventasPorFuncionarioMultiGQL = inject(VentasPorFuncionarioMultiGQL);
  private formaPagoMultiGQL = inject(FormaPagoEstadisticasMultiGQL);
  private gastosPorCategoriaMultiGQL = inject(GastosPorCategoriaMultiGQL);
  private ventasPorSucursalMultiGQL = inject(VentasPorSucursalMultiGQL);
  private productosMasVendidosMultiGQL = inject(ProductosMasVendidosMultiGQL);
  private ingresosGastosPorMesMultiGQL = inject(IngresosGastosPorMesMultiGQL);
  private ventasPorHoraMultiGQL = inject(VentasPorHoraMultiGQL);
  private ventasProductoPorDiaGQL = inject(VentasProductoPorDiaGQL);
  private ventasProductoPorMesGQL = inject(VentasProductoPorMesGQL);
  private comprasProductoPorDiaGQL = inject(ComprasProductoPorDiaGQL);
  private comprasProductoPorMesGQL = inject(ComprasProductoPorMesGQL);

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

  obtenerProductosMasVendidos(
    inicio: string,
    fin: string,
    sucId?: number,
    familiaId?: number,
    limit: number = 10,
    ascendente: boolean = false,
    productoId?: number,
    productoIds?: number[]
  ): Observable<ProductoVendidoEstadistica[]> {
    const ids = productoIds?.length ? productoIds.map(id => String(id)) : null;
    return this.genericService.onCustomQuery(
      this.productosMasVendidosGQL,
      {
        inicio, fin, limit, ascendente,
        sucursalId: sucId ? String(sucId) : null,
        familiaId: familiaId ? String(familiaId) : null,
        productoId: productoId ? String(productoId) : null,
        productoIds: ids
      },
      true,
      null,
      true
    );
  }

  obtenerVentasProductoPorDia(inicio: string, fin: string, productoId: number, sucId?: number): Observable<ProductoVentaPorPeriodo[]> {
    return this.genericService.onCustomQuery(
      this.ventasProductoPorDiaGQL,
      {
        inicio, fin,
        productoId: String(productoId),
        sucursalId: sucId ? String(sucId) : null
      },
      true,
      null,
      true
    );
  }

  obtenerVentasProductoPorMes(inicio: string, fin: string, productoId: number, sucId?: number): Observable<ProductoVentaPorPeriodo[]> {
    return this.genericService.onCustomQuery(
      this.ventasProductoPorMesGQL,
      {
        inicio, fin,
        productoId: String(productoId),
        sucursalId: sucId ? String(sucId) : null
      },
      true,
      null,
      true
    );
  }

  obtenerComprasProductoPorDia(inicio: string, fin: string, productoId: number, sucId?: number): Observable<ProductoCompraPorPeriodo[]> {
    return this.genericService.onCustomQuery(
      this.comprasProductoPorDiaGQL,
      {
        inicio, fin,
        productoId: String(productoId),
        sucursalId: sucId ? String(sucId) : null
      },
      true,
      null,
      true
    );
  }

  obtenerComprasProductoPorMes(inicio: string, fin: string, productoId: number, sucId?: number): Observable<ProductoCompraPorPeriodo[]> {
    return this.genericService.onCustomQuery(
      this.comprasProductoPorMesGQL,
      {
        inicio, fin,
        productoId: String(productoId),
        sucursalId: sucId ? String(sucId) : null
      },
      true,
      null,
      true
    );
  }

  obtenerVentasPorFuncionarioMulti(
    periodos: PeriodoGraficoInput[],
    sucIds?: number[],
    usuarioIds?: number[]
  ): Observable<VentaFuncionarioItem[]> {
    return this.genericService.onCustomQuery(
      this.ventasPorFuncionarioMultiGQL,
      {
        periodos,
        sucIds: sucIds?.length ? sucIds.map(String) : null,
        usuarioIds: usuarioIds?.length ? usuarioIds.map(String) : null,
      },
      true,
      null,
      true
    );
  }

  obtenerEstadisticasFormaPagoMulti(
    periodos: PeriodoGraficoInput[],
    sucIds?: number[]
  ): Observable<FormaPagoEstadistica[]> {
    return this.genericService.onCustomQuery(
      this.formaPagoMultiGQL,
      {
        periodos,
        sucIds: sucIds?.length ? sucIds.map(String) : null,
      },
      true,
      null,
      true
    );
  }

  obtenerGastosPorCategoriaMulti(
    periodos: PeriodoGraficoInput[],
    sucIds?: number[]
  ): Observable<GastoCategoriaItem[]> {
    return this.genericService.onCustomQuery(
      this.gastosPorCategoriaMultiGQL,
      {
        periodos,
        sucIds: sucIds?.length ? sucIds.map(String) : null,
      },
      true,
      null,
      true
    );
  }

  obtenerVentasPorSucursalMulti(
    periodos: PeriodoGraficoInput[]
  ): Observable<VentaSucursalItem[]> {
    return this.genericService.onCustomQuery(
      this.ventasPorSucursalMultiGQL,
      { periodos },
      true,
      null,
      true
    );
  }

  obtenerProductosMasVendidosMulti(
    periodos: PeriodoGraficoInput[],
    sucIds?: number[],
    familiaId?: number,
    limit = 10,
    ascendente = false,
    productoIds?: number[]
  ): Observable<ProductoVendidoEstadistica[]> {
    return this.genericService.onCustomQuery(
      this.productosMasVendidosMultiGQL,
      {
        periodos,
        sucIds: sucIds?.length ? sucIds.map(String) : null,
        limit,
        ascendente,
        familiaId: familiaId ? String(familiaId) : null,
        productoIds: productoIds?.length ? productoIds.map(String) : null,
      },
      true,
      null,
      true
    );
  }

  obtenerIngresosGastosPorMesMulti(
    anios: number[],
    sucIds?: number[]
  ): Observable<IngresoGastoSerieGrafico[]> {
    return this.genericService.onCustomQuery(
      this.ingresosGastosPorMesMultiGQL,
      {
        anios,
        sucIds: sucIds?.length ? sucIds.map(String) : null,
      },
      true,
      null,
      true
    );
  }

  obtenerVentasPorHoraMulti(
    periodos: PeriodoGraficoInput[],
    sucIds?: number[]
  ): Observable<VentasPorHoraSerieGrafico[]> {
    return this.genericService.onCustomQuery(
      this.ventasPorHoraMultiGQL,
      {
        periodos,
        sucIds: sucIds?.length ? sucIds.map(String) : null,
      },
      true,
      null,
      true
    );
  }
}
