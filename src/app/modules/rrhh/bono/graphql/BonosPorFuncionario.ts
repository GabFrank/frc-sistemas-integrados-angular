import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Bono } from '../bono.model';
import { bonosPorFuncionarioQuery } from './graphql-query';

export interface Response { data: Bono[]; }

@Injectable({ providedIn: 'root' })
export class BonosPorFuncionarioGQL extends Query<Response> { document = bonosPorFuncionarioQuery; }
