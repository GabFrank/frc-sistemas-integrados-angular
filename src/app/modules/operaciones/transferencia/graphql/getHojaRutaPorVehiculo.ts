import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { HojaRuta } from '../transferencia.model';
import { hojaRutaPorVehiculoQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetHojaRutaPorVehiculoGQL extends Query<HojaRuta[]> {
    document = hojaRutaPorVehiculoQuery;
}
