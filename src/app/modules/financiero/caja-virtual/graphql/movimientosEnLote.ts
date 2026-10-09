import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { realizarTransferenciasCajaVirtualMutation, registrarMovimientosCajaVirtualMutation } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({ providedIn: 'root' })
export class RegistrarMovimientosCajaVirtualGQL extends Mutation<Response> {
  document = registrarMovimientosCajaVirtualMutation;
}

@Injectable({ providedIn: 'root' })
export class RealizarTransferenciasCajaVirtualGQL extends Mutation<Response> {
  document = realizarTransferenciasCajaVirtualMutation;
}
