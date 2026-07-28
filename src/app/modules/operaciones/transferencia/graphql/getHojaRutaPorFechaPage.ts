import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { HojaRuta } from '../transferencia.model';
import { hojaRutaPorFechaPageQuery } from './graphql-query';
import { PageInfo } from '../../../../app.component';

export interface Response {
    data: PageInfo<HojaRuta>;
}

@Injectable({
    providedIn: 'root',
})
export class GetHojaRutaPorFechaPageGQL extends Query<Response> {
    override document = hojaRutaPorFechaPageQuery;
}
