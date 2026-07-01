import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { CuotaDetalle } from '../../shared/models/cuota-detalle.model';
import { enteCuotasByEnteIdQuery } from './graphql-query';

export interface EnteCuotaDto {
  id?: number;
  numeroCuota?: number;
  monto?: number;
  pagado?: boolean;
  fechaVencimiento?: string;
}

export interface Response {
  data: EnteCuotaDto[];
}

@Injectable({ providedIn: 'root' })
export class EnteCuotasByEnteIdGQL extends Query<Response> {
  override document = enteCuotasByEnteIdQuery;
}
