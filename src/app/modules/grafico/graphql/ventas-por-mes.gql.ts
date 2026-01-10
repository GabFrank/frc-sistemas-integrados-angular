import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
    providedIn: 'root',
})
export class VentasPorMesGQL extends Query<any> {
    document = gql`
        query ventasPorMes($anio: Int!, $sucId: ID) {
            data: ventasPorMes(anio: $anio, sucId: $sucId) {
                mes
                total
                cantidad
            }
        }
    `;
}
