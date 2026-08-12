import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Vale } from '../vale.model';
import { valesPorFuncionarioQuery } from './graphql-query';

export interface Response { data: Vale[]; }

@Injectable({ providedIn: 'root' })
export class ValesPorFuncionarioGQL extends Query<Response> { document = valesPorFuncionarioQuery; }
