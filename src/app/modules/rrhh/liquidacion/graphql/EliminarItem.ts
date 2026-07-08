import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { eliminarItemMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class EliminarItemGQL extends Mutation<Response> { document = eliminarItemMutation; }
