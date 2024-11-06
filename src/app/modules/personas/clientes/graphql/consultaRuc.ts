import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { RucResponse } from '../../../../shared/services/ruc.service';
import { Cliente } from '../cliente.model';
import { consultaRuc } from './graphql-query';

export interface Response {
  cliente: Cliente;
}


@Injectable({
  providedIn: 'root',
})
export class ConsultaRucGQL extends Query<RucResponse> {
  document = consultaRuc;
}
