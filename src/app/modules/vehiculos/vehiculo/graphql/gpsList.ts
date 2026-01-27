import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Gps } from '../models/gps.model';
import { gpsListQuery } from './graphql-query';

export interface Response {
    data: Gps[];
}

@Injectable({
    providedIn: 'root',
})
export class GpsListGQL extends Query<Response> {
    override document = gpsListQuery;
}
