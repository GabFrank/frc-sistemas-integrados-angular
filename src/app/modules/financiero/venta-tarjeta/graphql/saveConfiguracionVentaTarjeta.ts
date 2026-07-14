import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveConfiguracionVentaTarjeta } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class SaveConfiguracionVentaTarjetaGQL extends Mutation<any> {
    document = saveConfiguracionVentaTarjeta;
}
