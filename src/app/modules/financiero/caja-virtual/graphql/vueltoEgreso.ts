import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { egresosParaVueltoQuery, registrarVueltoEgresoMutation, rendidoTotalEgresoPreGastoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class EgresosParaVueltoGQL extends Query<Response> {
  document = egresosParaVueltoQuery;
}

@Injectable({ providedIn: 'root' })
export class RegistrarVueltoEgresoGQL extends Mutation<Response> {
  document = registrarVueltoEgresoMutation;
}

@Injectable({ providedIn: 'root' })
export class RendidoTotalEgresoPreGastoGQL extends Mutation<Response> {
  document = rendidoTotalEgresoPreGastoMutation;
}
