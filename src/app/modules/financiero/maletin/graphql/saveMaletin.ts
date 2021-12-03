import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Maletin } from '../maletin.model';
import { maletinQuery, saveMaletin } from './graphql-query';

export interface Response {
  data: Maletin;
}

@Injectable({
  providedIn: 'root',
})
export class SaveMaletinGQL extends Mutation<Response> {
  document = saveMaletin;
}
