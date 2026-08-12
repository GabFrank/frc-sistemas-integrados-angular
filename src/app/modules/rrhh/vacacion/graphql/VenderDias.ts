import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { venderDiasMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class VenderDiasGQL extends Mutation<Response> { document = venderDiasMutation; }
