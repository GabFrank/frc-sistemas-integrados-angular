import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { SolicitudRecuperacionContrasena } from '../recuperacion-contrasena.model';
import { solicitudesRecuperacionContrasenaQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class SolicitudesRecuperacionContrasenaGQL extends Query<PageInfo<SolicitudRecuperacionContrasena>> {
  document = solicitudesRecuperacionContrasenaQuery;
}
