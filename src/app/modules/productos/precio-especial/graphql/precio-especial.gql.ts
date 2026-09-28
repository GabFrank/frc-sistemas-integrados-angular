import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import {
  cortarPrecioEspecialMutation, editarPrecioEspecialMutation, filterPreciosEspecialesQuery,
  preciosEspecialesPorPrecioQuery, savePreciosEspecialesMutation,
} from './graphql-query';

@Injectable({ providedIn: 'root' })
export class PreciosEspecialesPorPrecioGQL extends Query<any> { document = preciosEspecialesPorPrecioQuery; }

@Injectable({ providedIn: 'root' })
export class FilterPreciosEspecialesGQL extends Query<any> { document = filterPreciosEspecialesQuery; }

@Injectable({ providedIn: 'root' })
export class SavePreciosEspecialesGQL extends Mutation<any> { document = savePreciosEspecialesMutation; }

@Injectable({ providedIn: 'root' })
export class EditarPrecioEspecialGQL extends Mutation<any> { document = editarPrecioEspecialMutation; }

@Injectable({ providedIn: 'root' })
export class CortarPrecioEspecialGQL extends Mutation<any> { document = cortarPrecioEspecialMutation; }
