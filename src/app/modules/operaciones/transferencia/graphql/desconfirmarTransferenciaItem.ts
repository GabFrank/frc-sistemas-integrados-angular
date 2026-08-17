import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { TransferenciaItem } from '../transferencia.model';
import { desconfirmarTransferenciaItem } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DesconfirmarTransferenciaItemGQL extends Mutation<TransferenciaItem> {
  document = desconfirmarTransferenciaItem;
}
