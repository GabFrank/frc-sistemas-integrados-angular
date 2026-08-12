import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Justificativo } from '../justificativo.model';
import { justificativosPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class JustificativosPageGQL extends Query<PageInfo<Justificativo>> { document = justificativosPageQuery; }
