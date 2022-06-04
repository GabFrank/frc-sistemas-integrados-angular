import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteZonaQuery, saveZona } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteZonaGQL extends Mutation<boolean> {
  document = deleteZonaQuery;
}
