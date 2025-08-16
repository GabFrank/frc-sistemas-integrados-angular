import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { registrarEventoDteMutation } from './graphql-query';

export interface EventoDteDto {
  id: number;
  tipoEvento: number;
  fechaEvento: string;
  cdcEvento?: string;
  mensajeRespuestaSifen?: string;
  motivo?: string;
  observacion?: string;
}

@Injectable({ providedIn: 'root' })
export class RegistrarEventoDteGQL extends Mutation<{ data: EventoDteDto }> {
  document = registrarEventoDteMutation;
}
