import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { Persona } from '../persona.model';
import { PageInfo } from '../../../../app.component';

export interface Response {
    data: PageInfo<Persona>;
}

@Injectable({
    providedIn: 'root',
})
export class PersonaSearchPageGQL extends Query<Response> {
    document = gql`
        query ($texto: String, $page: Int, $size: Int) {
            data: personaSearchPage(texto: $texto, page: $page, size: $size) {
                getTotalPages
                getTotalElements
                getNumberOfElements
                isFirst
                isLast
                hasNext
                hasPrevious
                getContent {
                    id
                    nombre
                    apodo
                    documento
                    usuario {
                        id
                        nickname
                    }
                }
            }
        }
    `;
}
