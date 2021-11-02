import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Salida } from '../salida.model';
import { salidasQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GetAllSalidasGQL extends Query<Salida[]> {
  document = salidasQuery;
}
