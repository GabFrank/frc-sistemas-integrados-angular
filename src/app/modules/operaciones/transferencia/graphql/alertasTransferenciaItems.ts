import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TransferenciaItemAlerta } from '../transferencia.model';
import { alertasTransferenciaItemsQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class AlertasTransferenciaItemsGQL extends Query<TransferenciaItemAlerta[]> {
  document = alertasTransferenciaItemsQuery;
}
