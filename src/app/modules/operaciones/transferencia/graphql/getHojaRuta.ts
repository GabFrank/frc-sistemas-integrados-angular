import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { HojaRuta } from '../transferencia.model';
import { hojaRutaQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetHojaRutaGQL extends Query<HojaRuta> {
    document = hojaRutaQuery;
}
