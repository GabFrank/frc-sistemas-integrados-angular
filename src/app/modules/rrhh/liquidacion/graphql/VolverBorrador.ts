import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { volverBorradorMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class VolverBorradorGQL extends Mutation<Response> { document = volverBorradorMutation; }
