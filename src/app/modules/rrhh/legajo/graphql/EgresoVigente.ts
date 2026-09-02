import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { egresoVigenteQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class EgresoVigenteGQL extends Query<Response> { document = egresoVigenteQuery; }
