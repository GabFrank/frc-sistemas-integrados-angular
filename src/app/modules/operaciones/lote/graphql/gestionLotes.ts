import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import {
  archivarLoteMutation,
  desarchivarLoteMutation,
  eliminarLoteMutation,
  gestionLotesDeProductoQuery,
  lotesEliminadosDeProductoQuery,
  restaurarLoteMutation
} from './graphql-query';

@Injectable({ providedIn: 'root' })
export class GestionLotesDeProductoGQL extends Query<any> {
  document = gestionLotesDeProductoQuery;
}

@Injectable({ providedIn: 'root' })
export class ArchivarLoteGQL extends Mutation<{ data: boolean }> {
  document = archivarLoteMutation;
}

@Injectable({ providedIn: 'root' })
export class DesarchivarLoteGQL extends Mutation<{ data: boolean }> {
  document = desarchivarLoteMutation;
}

@Injectable({ providedIn: 'root' })
export class LotesEliminadosDeProductoGQL extends Query<any> {
  document = lotesEliminadosDeProductoQuery;
}

@Injectable({ providedIn: 'root' })
export class EliminarLoteGQL extends Mutation<{ data: boolean }> {
  document = eliminarLoteMutation;
}

@Injectable({ providedIn: 'root' })
export class RestaurarLoteGQL extends Mutation<{ data: boolean }> {
  document = restaurarLoteMutation;
}
