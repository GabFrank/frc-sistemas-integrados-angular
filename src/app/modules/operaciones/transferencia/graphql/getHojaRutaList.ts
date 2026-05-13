import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { HojaRuta } from '../transferencia.model';
import { hojaRutaListQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetHojaRutaListGQL extends Query<HojaRuta[]> {
    document = hojaRutaListQuery;
}
