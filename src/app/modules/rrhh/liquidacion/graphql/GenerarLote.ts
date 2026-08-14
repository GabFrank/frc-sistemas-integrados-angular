import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { generarLoteMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class GenerarLoteGQL extends Mutation<Response> { document = generarLoteMutation; }
