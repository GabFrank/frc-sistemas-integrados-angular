import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import {
  ajustarSalariosAlMinimoMutation,
  configuracionRrhhHistoricoQuery,
  funcionariosBajoSalarioMinimoQuery
} from './graphql-query';

@Injectable({ providedIn: 'root' })
export class FuncionariosBajoSalarioMinimoGQL extends Query<any> {
  document = funcionariosBajoSalarioMinimoQuery;
}

@Injectable({ providedIn: 'root' })
export class AjustarSalariosAlMinimoGQL extends Mutation<any> {
  document = ajustarSalariosAlMinimoMutation;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionRrhhHistoricoGQL extends Query<any> {
  document = configuracionRrhhHistoricoQuery;
}
