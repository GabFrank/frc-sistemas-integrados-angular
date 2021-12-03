import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Maletin } from '../maletin.model';
import { deleteMaletinQuery, maletinQuery, saveMaletin } from './graphql-query';

export interface Response {
  data: Maletin;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteMaletinGQL extends Mutation<boolean> {
  document = deleteMaletinQuery;
}
