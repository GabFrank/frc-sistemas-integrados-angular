import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Inmueble } from '../models/inmueble.model';
import { inmuebleSearchPageQuery } from './graphql-query';
import { PageInfo } from '../../../../app.component';

export interface Response {
    data: PageInfo<Inmueble>;
}

@Injectable({
    providedIn: 'root',
})
export class InmuebleSearchPageGQL extends Query<Response> {
    override document = inmuebleSearchPageQuery;
}
