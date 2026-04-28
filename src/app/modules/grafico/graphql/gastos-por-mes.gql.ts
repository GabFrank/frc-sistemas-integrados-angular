import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
    providedIn: 'root',
})
export class GastosPorMesGQL extends Query<any> {
    document = gql`
        query gastosPorMes($anio: Int!, $sucId: ID) {
            data: gastosPorMes(anio: $anio, sucId: $sucId) {
                mes
                total
                cantidad
            }
        }
    `;
}
