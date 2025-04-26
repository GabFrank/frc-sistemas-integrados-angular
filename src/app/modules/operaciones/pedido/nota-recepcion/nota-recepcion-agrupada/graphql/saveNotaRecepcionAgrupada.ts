import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { NotaRecepcionAgrupada } from '../nota-recepcion-agrupada.model';
import { saveNotaRecepcionAgrupadaMutation } from './graphql-query';

export interface Response {
  data: NotaRecepcionAgrupada;
}

@Injectable({
  providedIn: 'root',
})
export class SaveNotaRecepcionAgrupadaGQL extends Mutation<Response> {
  document = saveNotaRecepcionAgrupadaMutation;
}
