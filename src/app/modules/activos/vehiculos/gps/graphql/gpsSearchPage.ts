import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Gps } from '../models/gps.model';
import { PageInfo } from '../../../../../app.component';
import { gpsSearchPageQuery } from './graphql-query';

export interface Response {
    data: PageInfo<Gps>;
}

/** La lista de GPS paginada en el central (#772). */
@Injectable({
    providedIn: 'root',
})
export class GpsSearchPageGQL extends Query<Response> {
    override document = gpsSearchPageQuery;
}
