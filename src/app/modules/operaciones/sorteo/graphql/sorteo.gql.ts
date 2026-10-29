import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import {
  cortarSorteoMutation, filterSorteosQuery, saveSorteoMutation, sorteoParticipacionesQuery, sorteoResumenQuery,
  sorteosAplicablesQuery,
} from './graphql-query';

@Injectable({ providedIn: 'root' })
export class FilterSorteosGQL extends Query<any> { document = filterSorteosQuery; }

@Injectable({ providedIn: 'root' })
export class SorteoParticipacionesGQL extends Query<any> { document = sorteoParticipacionesQuery; }

@Injectable({ providedIn: 'root' })
export class SorteoResumenGQL extends Query<any> { document = sorteoResumenQuery; }

@Injectable({ providedIn: 'root' })
export class SaveSorteoGQL extends Mutation<any> { document = saveSorteoMutation; }

@Injectable({ providedIn: 'root' })
export class CortarSorteoGQL extends Mutation<any> { document = cortarSorteoMutation; }

@Injectable({ providedIn: 'root' })
export class SorteosAplicablesGQL extends Query<any> { document = sorteosAplicablesQuery; }
