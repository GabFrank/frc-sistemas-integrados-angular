import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import {
  cajaVirtualRecibeEnviosQuery, cajasVirtualesReceptorasQuery, marcarCajaRecibeEnviosMutation
} from './graphql-query';

/** Lo único que se sabe de una caja a la que solo se le puede enviar plata. */
export interface CajaVirtualDestino {
  id: number;
  nombre: string;
  sucursalNombre?: string;
}

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class CajasVirtualesReceptorasGQL extends Query<Response> {
  document = cajasVirtualesReceptorasQuery;
}

@Injectable({ providedIn: 'root' })
export class CajaVirtualRecibeEnviosGQL extends Query<Response> {
  document = cajaVirtualRecibeEnviosQuery;
}

@Injectable({ providedIn: 'root' })
export class MarcarCajaRecibeEnviosGQL extends Mutation<Response> {
  document = marcarCajaRecibeEnviosMutation;
}
