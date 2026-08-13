import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Aguinaldo } from '../aguinaldo.model';
import { aguinaldosPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class AguinaldosPageGQL extends Query<PageInfo<Aguinaldo>> { document = aguinaldosPageQuery; }
