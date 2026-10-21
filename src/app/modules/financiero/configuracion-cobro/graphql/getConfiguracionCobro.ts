import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { configuracionCobroQuery } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class GetConfiguracionCobroGQL extends Query<any> {
    document = configuracionCobroQuery;
}
