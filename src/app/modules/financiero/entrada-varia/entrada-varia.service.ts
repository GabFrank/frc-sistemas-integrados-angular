import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { PageInfo } from '../../../app.component';
import { EntradaVaria, EntradaVariaCategoria } from './entrada-varia.model';
import { EntradasVariasGQL } from './graphql/entradasVarias';
import { EntradaVariaCategoriasGQL } from './graphql/entradaVariaCategorias';
import { RegistrarEntradaVariaGQL, RegistrarEntradaVariaSinClaveGQL } from './graphql/registrarEntradaVaria';
import { centralNoConoceLaClave, conClaveSiElCentralLaConoce, OpcionesDePedidoConClave } from '../../../commons/core/utils/claveIdempotencia';
import { AnularEntradaVariaGQL } from './graphql/anularEntradaVaria';

/** Un alta de entrada o salida varia lista para enviar: el input ya armado y la clave de ese intento. */
export interface PedidoDeEntradaVaria {
  input: any;
  claveIdempotencia: string;
}

/** Listados y catálogos con un solo suscriptor por método, que maneja el error (#390). */
const CONSULTA_ENTRADAS: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };

@Injectable({
  providedIn: 'root'
})
export class EntradaVariaService {

  constructor(
    private genericService: GenericCrudService,
    private entradasVariasGQL: EntradasVariasGQL,
    private categoriasGQL: EntradaVariaCategoriasGQL,
    private registrarGQL: RegistrarEntradaVariaGQL,
    private anularGQL: AnularEntradaVariaGQL,
    private registrarSinClaveGQL: RegistrarEntradaVariaSinClaveGQL,
  ) { }

  onGetEntradasVarias(cajaVirtualId: number, page = 0, size = 10): Observable<PageInfo<EntradaVaria>> {
    return this.genericService.onCustomQuery(this.entradasVariasGQL, { cajaVirtualId, page, size }, true,
      PROPAGAR_ERROR_DE_RED, undefined, CONSULTA_ENTRADAS);
  }

  onGetCategorias(): Observable<EntradaVariaCategoria[]> {
    return this.genericService.onCustomQuery(this.categoriasGQL, {}, true, PROPAGAR_ERROR_DE_RED, undefined,
      CONSULTA_ENTRADAS);
  }

  /**
   * Registra el pedido tal como viene: el input ya armado y su clave, para que un reintento mande exactamente
   * lo mismo. `opciones.sinClave` avisa si el central no conoce la clave (se registró —o se intentó— sin ella).
   */
  onRegistrar(pedido: PedidoDeEntradaVaria, opciones?: { avisarExito?: boolean } & OpcionesDePedidoConClave): Observable<EntradaVaria> {
    return conClaveSiElCentralLaConoce(conClave => conClave
      ? this.genericService.onSaveCustom<EntradaVaria>(this.registrarGQL,
          { input: pedido.input, claveIdempotencia: pedido.claveIdempotencia }, true,
          { avisarExito: opciones?.avisarExito, silenciarRechazo: centralNoConoceLaClave })
      : this.genericService.onSaveCustom<EntradaVaria>(this.registrarSinClaveGQL, { input: pedido.input }, true,
          { avisarExito: opciones?.avisarExito }),
      opciones?.sinClave, !opciones?.esReenvio);
  }

  onAnular(id: number, motivo?: string, opciones?: { avisarExito?: boolean }): Observable<EntradaVaria> {
    return this.genericService.onSaveCustom(this.anularGQL, { id, motivo: motivo?.toUpperCase() }, true, opciones);
  }
}
