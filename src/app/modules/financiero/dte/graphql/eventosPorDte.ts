import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { eventosPorDteQuery } from './graphql-query';
import { EventoDteDto } from './registrarEventoDte';

@Injectable({ providedIn: 'root' })
export class EventosPorDteGQL extends Query<{ data: EventoDteDto[] }> {
  document = eventosPorDteQuery;
}
