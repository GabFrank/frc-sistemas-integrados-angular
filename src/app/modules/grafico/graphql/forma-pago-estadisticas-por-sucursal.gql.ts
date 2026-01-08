import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FormaPagoEstadistica } from '../models/forma-pago-estadistica.model';
import { formaPagoEstadisticasPorSucursalQuery } from './forma-pago-estadisticas-query';

export interface Response {
    data: FormaPagoEstadistica[];
}

/**
 * Servicio para obtener estadísticas de formas de pago por sucursal
 */
@Injectable({
    providedIn: 'root',
})
export class FormaPagoEstadisticasPorSucursalGQL extends Query<Response> {
    document = formaPagoEstadisticasPorSucursalQuery;
}
