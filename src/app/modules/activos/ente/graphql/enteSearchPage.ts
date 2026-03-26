import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Ente } from '../models/ente.model';
import { enteSearchPageQuery } from './graphql-query';

export interface Response {
    data: PageInfo<Ente>;
}

@Injectable({
    providedIn: 'root',
})
export class EnteSearchPageGQL extends Query<Response> {
    override document = enteSearchPageQuery;
}
