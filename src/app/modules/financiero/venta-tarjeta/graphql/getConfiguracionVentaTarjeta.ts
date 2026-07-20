import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { configuracionVentaTarjetaQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetConfiguracionVentaTarjetaGQL extends Query<any> {
    document = configuracionVentaTarjetaQuery;
}
