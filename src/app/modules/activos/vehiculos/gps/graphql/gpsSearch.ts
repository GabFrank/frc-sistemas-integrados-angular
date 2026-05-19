import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Gps } from '../models/gps.model';
import { gpsSearchQuery } from './graphql-query';

export interface Response {
    data: Gps[];
}

@Injectable({
    providedIn: 'root',
})
export class GpsSearchGQL extends Query<Response> {
    override document = gpsSearchQuery;
}
