import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { vacacionesPorFuncionarioQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class VacacionesPorFuncionarioGQL extends Query<Response> { document = vacacionesPorFuncionarioQuery; }
