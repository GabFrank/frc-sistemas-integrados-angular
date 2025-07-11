import { Concepto } from "../../../../financiero/concepto/concepto.model";

export class RecepcionCostoAdicional {
    id: number;
    concepto: Concepto;
    valor: number;
}

export class RecepcionCostoAdicionalInput {
    id?: number;
    conceptoId: number;
    valor: number;
} 