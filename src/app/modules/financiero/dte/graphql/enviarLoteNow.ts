import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { enviarLoteNowMutation } from './graphql-query';

export interface LoteDto { 
  id: number; 
  idProtocoloSifen: string; 
  estadoSifen: string; 
}

@Injectable({ providedIn: 'root' })
export class EnviarLoteNowGQL extends Mutation<LoteDto> {
  document = enviarLoteNowMutation;
}


