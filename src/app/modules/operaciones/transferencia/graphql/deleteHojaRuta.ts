import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteHojaRuta } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class DeleteHojaRutaGQL extends Mutation<boolean> {
    document = deleteHojaRuta;
}
