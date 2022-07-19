import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Sector } from '../sector.model';
import { sectoresQuery } from './graphql-query';

export interface Response {
  data: Sector[];
}

@Injectable({
  providedIn: 'root',
})
export class SectoresGQL extends Query<Sector[]> {
  document = sectoresQuery;
}
