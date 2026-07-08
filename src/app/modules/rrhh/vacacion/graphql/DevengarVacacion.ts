import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { devengarVacacionMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class DevengarVacacionGQL extends Mutation<Response> { document = devengarVacacionMutation; }
