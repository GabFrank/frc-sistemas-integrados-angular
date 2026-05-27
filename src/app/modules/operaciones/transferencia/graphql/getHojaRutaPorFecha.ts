import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { HojaRuta } from '../transferencia.model';
import { hojaRutaPorFechaQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetHojaRutaPorFechaGQL extends Query<HojaRuta[]> {
    document = hojaRutaPorFechaQuery;
}
