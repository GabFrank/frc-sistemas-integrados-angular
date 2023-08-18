import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Funcionario } from '../funcionario.model';
import { funcionarioPorPersonaQuery } from './graphql-query';

export interface Response {
  data: Funcionario;
}

@Injectable({
  providedIn: 'root',
})
export class FuncionarioPorPersonaIdGQL extends Query<Response> {
  document = funcionarioPorPersonaQuery;
}
