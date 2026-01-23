import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { HojaRuta } from '../transferencia.model';
import { saveHojaRuta } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class SaveHojaRutaGQL extends Mutation<HojaRuta> {
    document = saveHojaRuta;
}
