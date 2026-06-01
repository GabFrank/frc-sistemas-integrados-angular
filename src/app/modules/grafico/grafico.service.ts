import { inject, Injectable } from '@angular/core';
import { GenericCrudService } from '../../generics/generic-crud.service';
import { VentaPorPeriodoGQL } from './graphql/venta-por-periodo.gql';

import { FormaPagoEstadisticasConFiltrosGQL } from './graphql/forma-pago-estadisticas-con-filtros.gql';
import { ProductosMasVendidosGQL } from './graphql/productos-mas-vendidos.gql';
import { VentasPorFuncionarioGQL } from './graphql/ventas-por-funcionario.gql';
import { SucursalService } from '../empresarial/sucursal/sucursal.service';
import { FamiliaService } from '../productos/familia/familia.service';
import { Observable } from 'rxjs';
import { VentaPorPeriodo } from './interfaces/venta-por-periodo.model';
import { Sucursal } from '../empresarial/sucursal/sucursal.model';
import { Familia } from '../productos/familia/familia.model';
import { VentasPorHoraGQL } from './graphql/ventas-por-hora.gql';
import { GastosPorCategoriaGQL } from './graphql/gastos-por-categoria.gql';
import { VentasPorMesGQL } from './graphql/ventas-por-mes.gql';
import { GastosPorMesGQL } from './graphql/gastos-por-mes.gql';
import { VentasPorSucursalGQL } from './graphql/ventas-por-sucursal.gql';
import { VentasProductoPorDiaGQL } from './graphql/ventas-producto-por-dia.gql';
import { VentasProductoPorMesGQL } from './graphql/ventas-producto-por-mes.gql';
import { ComprasProductoPorDiaGQL } from './graphql/compras-producto-por-dia.gql';
import { ComprasProductoPorMesGQL } from './graphql/compras-producto-por-mes.gql';
import { ProductoVentaPorPeriodo } from './interfaces/producto-venta-periodo.model';
import { ProductoCompraPorPeriodo } from './interfaces/producto-compra-periodo.model';
import { FormaPagoEstadistica } from './interfaces/forma-pago-estadistica.model';
import { ProductoVendidoEstadistica } from './interfaces/producto-vendido-estadistica.model';
import { VentaFuncionarioItem } from './interfaces/venta-funcionario-item.model';
import { VentasPorHoraItem } from './interfaces/ventas-por-hora-item.model';
import { GastoCategoriaItem } from './interfaces/gasto-categoria-item.model';
import { IngresoGastoMesAcumulado } from './interfaces/ingreso-gasto-mes-acumulado.model';
import { VentaSucursalItem } from './interfaces/venta-sucursal-item.model';

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
  private ventasPorHoraGQL = inject(VentasPorHoraGQL);
  private gastosPorCategoriaGQL = inject(GastosPorCategoriaGQL);
  private ventasPorMesGQL = inject(VentasPorMesGQL);
  private gastosPorMesGQL = inject(GastosPorMesGQL);
  private ventasPorSucursalGQL = inject(VentasPorSucursalGQL);
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

  obtenerEstadisticasFormaPago(inicio: string, fin: string, sucId?: number): Observable<FormaPagoEstadistica[]> {
    return this.genericService.onCustomQuery(
      this.formaPagoGQL,
      { inicio, fin, sucursalId: sucId ? String(sucId) : null },
      true,
      null,
      true
    );
  }

  obtenerProductosMasVendidos(inicio: string, fin: string, sucId?: number, familiaId?: number, limit: number = 10, ascendente: boolean = false, productoId?: number, productoIds?: number[]): Observable<ProductoVendidoEstadistica[]> {
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

  obtenerVentasPorFuncionario(inicio: string, fin: string, sucId?: number, usuarioId?: number): Observable<VentaFuncionarioItem[]> {
    return this.genericService.onCustomQuery(
      this.ventasPorFuncionarioGQL,
      {
        inicio, fin,
        sucId: sucId ? String(sucId) : null,
        usuarioId: usuarioId ? String(usuarioId) : null
      },
      true,
      null,
      true
    );
  }

  obtenerVentasPorHora(fecha: string, sucId?: number): Observable<VentasPorHoraItem[]> {
    return this.genericService.onCustomQuery(
      this.ventasPorHoraGQL,
      { fecha, sucId: sucId ? String(sucId) : null },
      true,
      null,
      true
    );
  }

  obtenerGastosPorCategoria(inicio: string, fin: string, sucId?: number): Observable<GastoCategoriaItem[]> {
    return this.genericService.onCustomQuery(
      this.gastosPorCategoriaGQL,
      { inicio, fin, sucId: sucId ? String(sucId) : null },
      true,
      null,
      true
    );
  }

  obtenerVentasPorMes(anio: number, sucId?: number): Observable<IngresoGastoMesAcumulado[]> {
    return this.genericService.onCustomQuery(
      this.ventasPorMesGQL,
      { anio, sucId: sucId ? String(sucId) : null },
      true,
      null,
      true
    );
  }

  obtenerGastosPorMes(anio: number, sucId?: number): Observable<IngresoGastoMesAcumulado[]> {
    return this.genericService.onCustomQuery(
      this.gastosPorMesGQL,
      { anio, sucId: sucId ? String(sucId) : null },
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

  obtenerVentasPorSucursal(inicio: string, fin: string): Observable<VentaSucursalItem[]> {
    return this.genericService.onCustomQuery(
      this.ventasPorSucursalGQL,
      { inicio, fin },
      true,
      null,
      true
    );
  }
}
