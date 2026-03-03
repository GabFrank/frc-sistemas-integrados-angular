import { Injectable } from '@angular/core';
import { DocumentNode } from 'graphql';
import { finalizarRecepcionNotasMutation } from './graphql-query';
import { Mutation, Query } from 'apollo-angular';

export interface FinalizarRecepcionNotasResponse {
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class FinalizarRecepcionNotasGQL extends Mutation<FinalizarRecepcionNotasResponse> {
    document = finalizarRecepcionNotasMutation;
} 