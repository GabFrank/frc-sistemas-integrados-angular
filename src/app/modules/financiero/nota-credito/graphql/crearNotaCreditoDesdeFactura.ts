import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { crearNotaCreditoDesdeFacturaMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class CrearNotaCreditoDesdeFacturaGQL extends Mutation<any> {
  document = crearNotaCreditoDesdeFacturaMutation;
}
