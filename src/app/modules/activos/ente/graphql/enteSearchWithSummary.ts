import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Ente } from '../models/ente.model';
import { enteSearchWithSummaryQuery } from './graphql-query';

export interface DashboardSummary {
    totalBienes: number;
    pagados: number;
    enPago: number;
    cuotasFaltantes: number;
    totalGastado: number;
    totalComprometido: number;
    totalPendiente: number;
    monedaPrincipal: string;
}

export interface EnteSearchResponse {
    page: PageInfo<Ente>;
    summary: DashboardSummary;
}

export interface Response {
    data: EnteSearchResponse;
}

@Injectable({
    providedIn: 'root',
})
export class EnteSearchWithSummaryGQL extends Query<Response> {
    override document = enteSearchWithSummaryQuery;
}
