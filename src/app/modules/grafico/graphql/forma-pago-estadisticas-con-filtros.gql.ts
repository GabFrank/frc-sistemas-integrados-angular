import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FormaPagoEstadistica } from '../models/forma-pago-estadistica.model';
import { formaPagoEstadisticasConFiltrosQuery } from './forma-pago-estadisticas-query';

export interface Response {
    data: FormaPagoEstadistica[];
}

/**
 * Servicio para obtener estadísticas de formas de pago con filtros de fecha y sucursal
 */
@Injectable({
    providedIn: 'root',
})
export class FormaPagoEstadisticasConFiltrosGQL extends Query<Response> {
    document = formaPagoEstadisticasConFiltrosQuery;
}
