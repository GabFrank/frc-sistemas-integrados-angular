import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { NotaRecepcionAgrupada } from '../nota-recepcion-agrupada.model';
import { reabrirRecepcionMutation } from './graphql-query';

interface Response {
  data: NotaRecepcionAgrupada;
}

@Injectable({
  providedIn: 'root'
})
export class ReabrirRecepcionGQL extends Mutation<Response> {
  document = reabrirRecepcionMutation;
} 