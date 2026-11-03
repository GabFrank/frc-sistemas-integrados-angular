import { Injectable } from "@angular/core";
import { Observable, of, throwError } from "rxjs";
import { map } from "rxjs/operators";
import { CONTEXTO_MOSTRADOR, PROPAGAR_ERROR_DE_RED } from "../../../../../generics/generic-crud.constantes";
import { GenericCrudService } from "../../../../../generics/generic-crud.service";
import { Moneda } from "../../../../financiero/moneda/moneda.model";
import { Delivery } from "../../../../operaciones/delivery/delivery.model";
import { VentaMoneda, VentaMonedaGQL } from "../../../../operaciones/venta/graphql/ventaMoneda";
import { Venta } from "../../../../operaciones/venta/venta.model";
import { redondearEnMoneda } from "../moneda-pdv.util";
import { ventaDeEmpresaAMonedaPdv } from "../moneda-pdv-guardado";

/** Por qué un delivery no se puede abrir en la moneda del PDV actual. */
export class DeliveryMonedaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeliveryMonedaError";
  }
}

/**
 * Lleva a la moneda del PDV un delivery leído del filial (que guarda los precios en la moneda de la empresa).
 * Solo se usa con otra moneda del PDV (Fase 4): con la de la empresa el delivery se usa tal como llega.
 */
@Injectable({ providedIn: "root" })
export class DeliveryMonedaService {
  constructor(private genericService: GenericCrudService, private ventaMonedaGQL: VentaMonedaGQL) {}

  /** La moneda con que se guardó la venta. */
  onGetMonedaDeVenta(ventaId: number, sucId?: number): Observable<VentaMoneda> {
    return this.genericService.onGetById<VentaMoneda>(
      this.ventaMonedaGQL, ventaId, null, null, false, sucId, null, null, true, null, null,
      PROPAGAR_ERROR_DE_RED, CONTEXTO_MOSTRADOR);
  }

  /**
   * Convierte en el lugar la venta del delivery (precios, descuentos y total) a la moneda del PDV, con la
   * cotización con que se guardó, y la tarifa de envío (que está en la moneda de la empresa) en `envioEnBase`.
   * Falla con {@link DeliveryMonedaError} si la venta no se guardó en la moneda del PDV actual: mezclar monedas
   * dejaría precios mal.
   */
  convertirABase(delivery: Delivery, monedaPdv: Moneda): Observable<Delivery> {
    const venta: Venta = delivery?.venta;
    if (venta?.id == null) return throwError(() => new DeliveryMonedaError("El delivery no tiene venta."));
    // Una venta ya convertida (lleva su moneda y cotización, que las consultas del filial no traen): no dividir dos veces.
    if (venta.monedaId != null && venta.cotizacion != null) return of(delivery);
    return this.onGetMonedaDeVenta(venta.id, venta.sucursalId).pipe(
      map((m) => {
        const cotizacion = m?.cotizacion != null ? Number(m.cotizacion) : null;
        if (m?.moneda?.id == null || cotizacion == null || !(cotizacion > 0)) {
          throw new DeliveryMonedaError(
            "Este delivery se armó en la moneda de la empresa: terminalo antes de cambiar la moneda del PDV.");
        }
        if (String(m.moneda.id) !== String(monedaPdv?.id)) {
          throw new DeliveryMonedaError("Este delivery se armó en otra moneda que la del PDV actual.");
        }
        ventaDeEmpresaAMonedaPdv(venta, monedaPdv, cotizacion);
        delivery.envioEnBase = delivery.precio?.valor != null
          ? redondearEnMoneda(+delivery.precio.valor / cotizacion, monedaPdv)
          : undefined;
        return delivery;
      })
    );
  }
}
