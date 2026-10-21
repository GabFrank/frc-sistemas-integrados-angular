import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { rechazarNotaRecepcionItemMutation } from './graphql-query';
import { RechazoNotaRecepcionItemResultado } from '../models/rechazar-nota-recepcion-item.model';

@Injectable({
  providedIn: 'root'
})
export class RechazarNotaRecepcionItemGQL extends Mutation<{ data: RechazoNotaRecepcionItemResultado }> {
  document = rechazarNotaRecepcionItemMutation;
}
