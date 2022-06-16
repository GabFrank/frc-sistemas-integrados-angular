import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { savePreRegistroFuncionario } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SavePreRegistroFuncionarioGQL extends Mutation<boolean> {
  document = savePreRegistroFuncionario;
}
