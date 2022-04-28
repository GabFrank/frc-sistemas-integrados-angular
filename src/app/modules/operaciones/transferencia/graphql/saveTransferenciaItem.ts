import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { TransferenciaItem } from '../transferencia.model';
import { saveTransferenciaItem } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveTransferenciaItemGQL extends Mutation<TransferenciaItem> {
  document = saveTransferenciaItem;
}
