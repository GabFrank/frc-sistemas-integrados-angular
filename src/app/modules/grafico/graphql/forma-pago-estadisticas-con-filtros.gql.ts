import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FormaPagoEstadistica } from '../forma-pago/interfaces/forma-pago-estadistica.model';
import { formaPagoEstadisticasConFiltrosQuery } from './forma-pago-estadisticas-query';

export interface Response {
    data: FormaPagoEstadistica[];
}
@Injectable({
    providedIn: 'root',
})
export class FormaPagoEstadisticasConFiltrosGQL extends Query<Response> {
    document = formaPagoEstadisticasConFiltrosQuery;
}
