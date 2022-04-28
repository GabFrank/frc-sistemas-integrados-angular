import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Transferencia } from '../transferencia.model';
import { saveTransferencia } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveTransferenciaGQL extends Mutation<Transferencia> {
  document = saveTransferencia;
}
