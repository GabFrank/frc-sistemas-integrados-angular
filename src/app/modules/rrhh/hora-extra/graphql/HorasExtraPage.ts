import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { HoraExtra } from '../hora-extra.model';
import { horasExtraPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class HorasExtraPageGQL extends Query<PageInfo<HoraExtra>> { document = horasExtraPageQuery; }
