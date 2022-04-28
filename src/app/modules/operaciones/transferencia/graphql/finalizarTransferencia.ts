import { Mutation } from 'apollo-angular';
import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Transferencia } from '../transferencia.model';
import { transferenciaQuery, finalizarTransferencia } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class FinalizarTransferenciaGQL extends Mutation<Transferencia> {
  document = finalizarTransferencia;
}
