import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SolicitudRecuperacionContrasena } from '../recuperacion-contrasena.model';
import { aprobarRecuperacionContrasenaMutation } from './graphql-query';

export interface Response { data: SolicitudRecuperacionContrasena; }

@Injectable({ providedIn: 'root' })
export class AprobarRecuperacionContrasenaGQL extends Mutation<Response> {
  document = aprobarRecuperacionContrasenaMutation;
}
