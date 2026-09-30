import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { programarItemMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ProgramarItemGQL extends Mutation<Response> { document = programarItemMutation; }
