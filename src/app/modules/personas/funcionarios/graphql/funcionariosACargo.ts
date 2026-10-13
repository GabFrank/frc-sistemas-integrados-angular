import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Funcionario } from '../funcionario.model';
import { funcionariosACargoQuery } from './graphql-query';

export interface Response {
  data: Funcionario[];
}

@Injectable({
  providedIn: 'root',
})
export class FuncionariosACargoGQL extends Query<Response> {
  document = funcionariosACargoQuery;
}
