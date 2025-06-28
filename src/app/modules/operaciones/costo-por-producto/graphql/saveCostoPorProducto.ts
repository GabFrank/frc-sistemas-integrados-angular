import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { CostoPorProducto } from '../costo-por-producto.model';
import { saveCostoPorProductoMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveCostoPorProductoGQL extends Mutation<CostoPorProducto> {
  document = saveCostoPorProductoMutation;
} 