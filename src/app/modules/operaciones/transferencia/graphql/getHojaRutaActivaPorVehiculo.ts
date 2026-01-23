import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { HojaRuta } from '../transferencia.model';
import { hojaRutaActivaPorVehiculoQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetHojaRutaActivaPorVehiculoGQL extends Query<HojaRuta> {
    document = hojaRutaActivaPorVehiculoQuery;
}
