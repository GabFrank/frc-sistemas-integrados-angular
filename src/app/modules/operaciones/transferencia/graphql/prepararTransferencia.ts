import { Mutation } from 'apollo-angular';
import { Injectable } from '@angular/core';
import { Transferencia } from '../transferencia.model';
import { prepararTransferencia } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class PrepararTransferenciaGQL extends Mutation<Transferencia> {
  document = prepararTransferencia;
}
