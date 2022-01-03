import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { printVale } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class PrintValeGQL extends Query<Boolean> {
  document = printVale;
}
