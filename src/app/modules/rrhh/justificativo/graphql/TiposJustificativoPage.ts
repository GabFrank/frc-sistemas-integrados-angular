import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { TipoJustificativo } from '../justificativo.model';
import { tiposJustificativoPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class TiposJustificativoPageGQL extends Query<PageInfo<TipoJustificativo>> { document = tiposJustificativoPageQuery; }
