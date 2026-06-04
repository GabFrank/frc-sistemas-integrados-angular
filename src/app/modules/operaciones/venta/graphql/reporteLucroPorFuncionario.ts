import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { lucroPorFuncionarioQuery } from './graphql-query';

export class Response {
  data: string
}

@Injectable({
  providedIn: 'root',
})
export class ReporteLucroPorFuncionarioGQL extends Query<Response> {
  document = lucroPorFuncionarioQuery;
}
