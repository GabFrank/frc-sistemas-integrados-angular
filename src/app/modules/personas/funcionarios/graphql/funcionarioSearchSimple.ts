import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Funcionario } from '../funcionario.model';
import { funcionariosSearchSimple } from './graphql-query';

export interface Response {
  data: Funcionario[];
}

@Injectable({
  providedIn: 'root',
})
export class FuncionarioSearchSimpleGQL extends Query<Response> {
  document = funcionariosSearchSimple;
}
