import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deletePreRegistroFuncionarioQuery, savePreRegistroFuncionario } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeletePreRegistroFuncionarioGQL extends Mutation<boolean> {
  document = deletePreRegistroFuncionarioQuery;
}
