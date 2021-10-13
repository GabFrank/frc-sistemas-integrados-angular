import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { printImage } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class PrintImageGQL extends Query<Boolean> {
  document = printImage;
}
