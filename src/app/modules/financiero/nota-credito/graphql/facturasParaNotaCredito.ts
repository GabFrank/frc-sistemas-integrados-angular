import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { facturasParaNotaCreditoQuery } from './graphql-query';

/** Facturas que admiten nota de crédito, para el buscador del botón «Adicionar». */
@Injectable({ providedIn: 'root' })
export class FacturasParaNotaCreditoGQL extends Query<any> {
  override document = facturasParaNotaCreditoQuery;
}
