import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { HojaRuta } from '../transferencia.model';
import { hojaRutaPorChoferQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetHojaRutaPorChoferGQL extends Query<HojaRuta[]> {
    document = hojaRutaPorChoferQuery;
}
