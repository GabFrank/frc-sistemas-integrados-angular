import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { cajerosConCajaAbiertaQuery } from './graphql-query';

export interface ResponseCajerosConCajaAbierta {
  data: Array<Usuario>;
}

@Injectable({
  providedIn: 'root',
})
export class CajerosConCajaAbiertaGQL extends Query<ResponseCajerosConCajaAbierta> {
  document = cajerosConCajaAbiertaQuery;
}
