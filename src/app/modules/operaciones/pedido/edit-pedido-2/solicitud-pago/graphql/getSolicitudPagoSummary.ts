import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { GET_SOLICITUD_PAGO_SUMMARY, SolicitudPagoSummary } from "./graphql-query";

export interface GetSolicitudPagoSummaryResponse {
  data: SolicitudPagoSummary;
}

@Injectable({
  providedIn: 'root'
})
export class GetSolicitudPagoSummaryGQL extends Query<GetSolicitudPagoSummaryResponse> {
  document = GET_SOLICITUD_PAGO_SUMMARY;
} 