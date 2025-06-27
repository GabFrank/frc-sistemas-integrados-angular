import { Injectable } from "@angular/core";
import { Mutation } from "apollo-angular";
import { FINALIZAR_SOLICITUD_PAGO_STEP } from "./graphql-query";
import { SolicitudPago } from "../../../../solicitud-pago/solicitud-pago.model";

export interface FinalizarSolicitudPagoStepResponse {
  data: SolicitudPago[];
}

@Injectable({
  providedIn: 'root'
})
export class FinalizarSolicitudPagoStepGQL extends Mutation<FinalizarSolicitudPagoStepResponse> {
  document = FINALIZAR_SOLICITUD_PAGO_STEP;
} 