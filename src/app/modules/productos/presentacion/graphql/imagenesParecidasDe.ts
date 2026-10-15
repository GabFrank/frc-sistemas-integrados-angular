import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imagenesParecidasDeQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class ImagenesParecidasDeGQL extends Query<any> {
  document = imagenesParecidasDeQuery;
}
