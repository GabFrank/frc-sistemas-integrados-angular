import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cambiarCargoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CambiarCargoGQL extends Mutation<Response> { document = cambiarCargoMutation; }
