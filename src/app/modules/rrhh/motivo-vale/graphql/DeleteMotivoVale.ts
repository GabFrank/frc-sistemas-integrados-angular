import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteMotivoValeMutation } from './graphql-query';

export interface Response { deleteMotivoVale: boolean; }

@Injectable({ providedIn: 'root' })
export class DeleteMotivoValeGQL extends Mutation<Response> { document = deleteMotivoValeMutation; }
