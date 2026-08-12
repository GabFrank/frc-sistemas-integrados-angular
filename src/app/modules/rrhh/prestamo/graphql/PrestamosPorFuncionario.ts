import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Prestamo } from '../prestamo.model';
import { prestamosPorFuncionarioQuery } from './graphql-query';

export interface Response { data: Prestamo[]; }

@Injectable({ providedIn: 'root' })
export class PrestamosPorFuncionarioGQL extends Query<Response> { document = prestamosPorFuncionarioQuery; }
