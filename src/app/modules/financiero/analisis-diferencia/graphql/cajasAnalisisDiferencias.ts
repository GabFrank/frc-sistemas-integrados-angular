import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../../pdv/caja/caja.model';
import { cajasAnalisisDiferencias } from '../../pdv/caja/graphql/graphql-query';

export interface Response {
  data: PdvCaja[];
}

@Injectable({
  providedIn: 'root',
})
export class CajasAnalisisDiferenciasGQL extends Query<Response> {
  document = cajasAnalisisDiferencias;
} 