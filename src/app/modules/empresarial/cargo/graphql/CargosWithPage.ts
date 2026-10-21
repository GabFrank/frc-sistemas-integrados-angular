import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Cargo } from '../cargo.model';
import { cargosWithPageQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class CargosWithPageGQL extends Query<PageInfo<Cargo>> {
  document = cargosWithPageQuery;
}
