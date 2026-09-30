import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularItemProgramadoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AnularItemProgramadoGQL extends Mutation<Response> { document = anularItemProgramadoMutation; }
