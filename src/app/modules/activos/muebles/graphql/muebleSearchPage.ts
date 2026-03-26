import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Mueble } from '../models/mueble.model';
import { muebleSearchPageQuery } from './graphql-query';

export interface Response {
    data: PageInfo<Mueble>;
}

@Injectable({
    providedIn: 'root',
})
export class MuebleSearchPageGQL extends Query<Response> {
    override document = muebleSearchPageQuery;
}
