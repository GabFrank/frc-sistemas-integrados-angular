import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { EnteSucursal } from '../models/ente-sucursal.model';
import { enteSucursalSearchPageQuery } from './graphql-query';

export interface Response {
    data: PageInfo<EnteSucursal>;
}

@Injectable({
    providedIn: 'root',
})
export class EnteSucursalSearchPageGQL extends Query<Response> {
    override document = enteSucursalSearchPageQuery;
}
