import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveSector } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveSectorGQL extends Mutation<boolean> {
  document = saveSector;
}
