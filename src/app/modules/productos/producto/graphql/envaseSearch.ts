import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { envaseSearchPdv, productoPorCodigoQuery, productoSearchPdv} from './graphql-query';

export interface Response {
  data: Producto[];
}

@Injectable({
  providedIn: 'root',
})
export class EnvaseSearchGQL extends Query<Response> {
  document = envaseSearchPdv;
}
