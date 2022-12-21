import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { CobroDetalle } from '../cobro/cobro-detalle.model';
import { saveCobroDetalleQuery } from './graphql-query';

class Response {
  data: CobroDetalle
}

@Injectable({
  providedIn: 'root',
})
export class SaveCobroDetalleGQL extends Mutation<Response> {
  document = saveCobroDetalleQuery;
}
