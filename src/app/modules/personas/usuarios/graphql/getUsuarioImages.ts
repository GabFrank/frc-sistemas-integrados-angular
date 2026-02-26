import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { getUsuarioImagesQuery } from './graphql-query';

export interface Response {
    data: string[];
}

@Injectable({
    providedIn: 'root',
})
export class GetUsuarioImagesGQL extends Query<Response> {
    document = getUsuarioImagesQuery;
}
