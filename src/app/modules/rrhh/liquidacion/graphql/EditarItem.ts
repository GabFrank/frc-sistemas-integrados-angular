import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { editarItemMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class EditarItemGQL extends Mutation<Response> { document = editarItemMutation; }
