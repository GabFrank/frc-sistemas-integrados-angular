import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import {
  dashboardRrhhKpisQuery,
  nominaSeriePorMesQuery,
  rrhhCumpleanosDelMesQuery,
  rrhhFuncionariosIncompletosQuery,
  rrhhTopExposicionQuery,
  rrhhTopHorasExtraQuery,
} from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class DashboardRrhhKpisGQL extends Query<Response> { document = dashboardRrhhKpisQuery; }

@Injectable({ providedIn: 'root' })
export class NominaSeriePorMesGQL extends Query<Response> { document = nominaSeriePorMesQuery; }

@Injectable({ providedIn: 'root' })
export class RrhhTopExposicionGQL extends Query<Response> { document = rrhhTopExposicionQuery; }

@Injectable({ providedIn: 'root' })
export class RrhhTopHorasExtraGQL extends Query<Response> { document = rrhhTopHorasExtraQuery; }

@Injectable({ providedIn: 'root' })
export class RrhhCumpleanosDelMesGQL extends Query<Response> { document = rrhhCumpleanosDelMesQuery; }

@Injectable({ providedIn: 'root' })
export class RrhhFuncionariosIncompletosGQL extends Query<Response> { document = rrhhFuncionariosIncompletosQuery; }
