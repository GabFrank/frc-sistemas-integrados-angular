import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { recepcionProductoNotaRecepcionAgrupadaMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class RecepcionProductoNotaRecepcionAgrupadaGQL extends Mutation {
  document = recepcionProductoNotaRecepcionAgrupadaMutation;
} 