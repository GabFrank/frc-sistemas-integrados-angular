import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cambiarSalarioMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CambiarSalarioGQL extends Mutation<Response> { document = cambiarSalarioMutation; }
