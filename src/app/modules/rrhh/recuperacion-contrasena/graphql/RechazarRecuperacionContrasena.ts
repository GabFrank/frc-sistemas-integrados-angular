import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SolicitudRecuperacionContrasena } from '../recuperacion-contrasena.model';
import { rechazarRecuperacionContrasenaMutation } from './graphql-query';

export interface Response { data: SolicitudRecuperacionContrasena; }

@Injectable({ providedIn: 'root' })
export class RechazarRecuperacionContrasenaGQL extends Mutation<Response> {
  document = rechazarRecuperacionContrasenaMutation;
}
