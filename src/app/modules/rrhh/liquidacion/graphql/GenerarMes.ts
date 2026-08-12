import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { generarMesMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class GenerarMesGQL extends Mutation<Response> { document = generarMesMutation; }
