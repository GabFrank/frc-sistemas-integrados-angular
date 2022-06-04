import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveZona } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveZonaGQL extends Mutation<boolean> {
  document = saveZona;
}
