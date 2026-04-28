import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FormaPagoEstadistica } from '../models/forma-pago-estadistica.model';
import { formaPagoEstadisticasQuery } from './forma-pago-estadisticas-query';

export interface Response {
    data: FormaPagoEstadistica[];
}

/**
 * Servicio para obtener estadísticas de formas de pago (todas las sucursales)
 */
@Injectable({
    providedIn: 'root',
})
export class FormaPagoEstadisticasGQL extends Query<Response> {
    document = formaPagoEstadisticasQuery;
}
