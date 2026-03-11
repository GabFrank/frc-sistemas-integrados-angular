import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { RECHAZAR_ITEM } from './rechazarItem';

export interface RechazoInput {
  sucursalId: number;
  cantidadRechazada: number;
  motivoRechazo: string;
  observaciones?: string;
}

export interface RechazarItemInput {
  notaRecepcionItemId: number;
  presentacionId?: number;
  rechazos: RechazoInput[];
  usuarioId: number;
}

@Injectable({
  providedIn: 'root'
})
export class RechazarItemGQL extends Mutation<{ data: boolean }, RechazarItemInput> {
  document = RECHAZAR_ITEM;
} 