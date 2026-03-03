import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveNotaRecepcionMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveNotaRecepcionGQL extends Mutation<any> {
  document = saveNotaRecepcionMutation;
} 