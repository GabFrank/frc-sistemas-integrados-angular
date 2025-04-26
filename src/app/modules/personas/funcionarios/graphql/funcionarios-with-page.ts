import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Funcionario } from '../funcionario.model';
import { funcionariosWithPageQuery } from './graphql-query';
import { PageInfo } from '../../../../app.component';

@Injectable({
  providedIn: 'root',
})
export class FuncionariosWithPageGQL extends Query<PageInfo<Funcionario>> {
  document = funcionariosWithPageQuery;
}
