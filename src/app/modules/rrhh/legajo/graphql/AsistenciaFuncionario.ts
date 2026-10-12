import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { asistenciaFuncionarioQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AsistenciaFuncionarioGQL extends Query<Response> { document = asistenciaFuncionarioQuery; }
