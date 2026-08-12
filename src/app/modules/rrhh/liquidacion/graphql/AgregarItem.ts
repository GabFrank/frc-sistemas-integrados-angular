import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { agregarItemMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AgregarItemGQL extends Mutation<Response> { document = agregarItemMutation; }
