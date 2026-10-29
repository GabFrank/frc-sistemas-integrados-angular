import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import {
  completarLotePendienteMutation,
  contarRecepcionesConLotePendienteQuery,
  descartarLotePendienteMutation,
  infoLotePendienteQuery,
  recepcionesConLotePendienteQuery
} from './graphql-query';
import { InfoPendienteLote, PendienteLotePage, ResolucionLotePendiente } from '../lote.model';

@Injectable({ providedIn: 'root' })
export class RecepcionesConLotePendienteGQL extends Query<{ data: PendienteLotePage }> {
  document = recepcionesConLotePendienteQuery;
}

@Injectable({ providedIn: 'root' })
export class ContarRecepcionesConLotePendienteGQL extends Query<{ data: number }> {
  document = contarRecepcionesConLotePendienteQuery;
}

@Injectable({ providedIn: 'root' })
export class InfoLotePendienteGQL extends Query<{ data: InfoPendienteLote }> {
  document = infoLotePendienteQuery;
}

@Injectable({ providedIn: 'root' })
export class CompletarLotePendienteGQL extends Mutation<{ data: ResolucionLotePendiente }> {
  document = completarLotePendienteMutation;
}

@Injectable({ providedIn: 'root' })
export class DescartarLotePendienteGQL extends Mutation<{ data: ResolucionLotePendiente }> {
  document = descartarLotePendienteMutation;
}
