import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Inmueble } from '../models/inmueble.model';
import { inmuebleSearchPageQuery } from './graphql-query';

export interface Response {
    data: PageInfo<Inmueble>;
}

@Injectable({
    providedIn: 'root',
})
export class InmuebleSearchPageGQL extends Query<Response> {
    override document = inmuebleSearchPageQuery;
}
