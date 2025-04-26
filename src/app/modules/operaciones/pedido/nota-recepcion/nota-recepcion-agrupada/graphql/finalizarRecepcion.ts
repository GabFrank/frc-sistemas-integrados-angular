import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { finalizarRecepcionMutation } from './graphql-query';
import { NotaRecepcionAgrupada } from '../nota-recepcion-agrupada.model';

@Injectable({
  providedIn: 'root',
})
export class FinalizarRecepcionGQL extends Mutation<
  { data: NotaRecepcionAgrupada },
  { id: number }
> {
  document = finalizarRecepcionMutation;
} 