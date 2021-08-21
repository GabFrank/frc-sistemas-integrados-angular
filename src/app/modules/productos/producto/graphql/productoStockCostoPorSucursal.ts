import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { MovimientoStock } from '../../../operaciones/movimiento-stock/movimiento-stock.model';
import { Producto } from '../producto.model';
import { productoStockCostoPorSucursal } from './graphql-query';

export interface ProductoStockCostoPorSucursal {
  sucursal: Sucursal;
  producto: Producto;
  ultimoPrecioCompra: number;
  ultimoPrecioVenta: number;
  costoMedio: number;
  movimientoStock: MovimientoStock;

}

export interface Response {
  data: ProductoStockCostoPorSucursal;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoStocCostoPorSucursalkGQL extends Query<Response> {
  document = productoStockCostoPorSucursal;
}
