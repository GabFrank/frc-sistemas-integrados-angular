import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { EstadoMarcacionUsuario } from '../models/estado-marcacion.model';
import { estadoMarcacionUsuarioQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetEstadoMarcacionUsuarioGQL extends Query<EstadoMarcacionUsuario> {
  document = estadoMarcacionUsuarioQuery;
}
