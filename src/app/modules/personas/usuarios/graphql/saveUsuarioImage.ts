import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { saveUsuarioImageQuery } from './graphql-query';

export interface Response {
    data: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class SaveUsuarioImageGQL extends Query<Response> {
    document = saveUsuarioImageQuery;
}
