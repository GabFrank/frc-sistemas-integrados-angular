import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { configuracionTransferenciaQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetConfiguracionTransferenciaGQL extends Query<any> {
    document = configuracionTransferenciaQuery;
}
