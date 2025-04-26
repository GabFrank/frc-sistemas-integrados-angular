import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { NotaRecepcionAgrupadaPorProveedorIdGQL } from "./graphql/notaRecepcionAgrupadaPorNotaRecepcionId";
import { NotaRecepcionListPorUsuarioIdGQL } from "./graphql/notaRecepcionListPorUsuarioId";
import { SaveNotaRecepcionAgrupadaGQL } from "./graphql/saveNotaRecepcionAgrupada";
import { NotaRecepcionAgrupada, NotaRecepcionAgrupadaInput } from "./nota-recepcion-agrupada.model";
import { NotaRecepcionAgrupadaPorIdGQL } from "./graphql/notaRecepcionAgrupadaPorId";
import { PedidoRecepcionProductoPorNotaRecepcionAgrupadaGQL } from "./graphql/pedido-recepcion-producto-por-nota-recepcion-agrupada";
import { PedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProductoGQL } from "./graphql/pedido-recepcion-producto-por-nota-recepcion-agrupada-and-producto";
import { PedidoRecepcionProductoDto } from "./pedido-recepcion-producto-dto.model";
import { RecepcionProductoNotaRecepcionAgrupadaGQL } from "./graphql/recepcion-producto-nota-recepcion-agrupada";
import { PedidoRecepcionProductoEstado } from "./pedido-recepcion-producto-dto.model";
import { FinalizarRecepcionGQL } from "./graphql/finalizarRecepcion";
import { ReabrirRecepcionGQL } from "./graphql/reabrirRecepcion";
import { SolicitarPagoNotaRecepcionAgrupadaGQL } from "./graphql/solicitarPagoNotaRecepcionAgrupada";
import { GenericCrudService } from "../../../../../generics/generic-crud.service";
import { SolicitudPago } from "../../../solicitud-pago/solicitud-pago.model";
import { PageInfo } from "../../../../../app.component";
@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionAgrupadaService {
  constructor(
    private genericService: GenericCrudService,
    private getNotaRecepcionAgrupadaPorNotaRecepcionId: NotaRecepcionAgrupadaPorProveedorIdGQL,
    private getNotaRecepcionAgrupadaListPorUsuarioId: NotaRecepcionListPorUsuarioIdGQL,
    private saveNotaRecepcionAgrupada: SaveNotaRecepcionAgrupadaGQL,
    private notaRecepcionAgrupadaPorId: NotaRecepcionAgrupadaPorIdGQL,
    private getPedidoRecepcionProductoPorNotaRecepcionAgrupada: PedidoRecepcionProductoPorNotaRecepcionAgrupadaGQL,
    private getPedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProducto: PedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProductoGQL,
    private recepcionProductoNotaRecepcionAgrupada: RecepcionProductoNotaRecepcionAgrupadaGQL,
    private finalizarRecepcion: FinalizarRecepcionGQL,
    private reabrirRecepcion: ReabrirRecepcionGQL,
    private solicitarPagoNotaRecepcionAgrupada: SolicitarPagoNotaRecepcionAgrupadaGQL
  ) {}

  onGetNotaRecepcionAgrupadaPorNotaRecepcionId(
    id,
    page,
    size
  ): Observable<PageInfo<NotaRecepcionAgrupada>> {
    return this.genericService.onGetById(this.getNotaRecepcionAgrupadaPorNotaRecepcionId, id);
  }

  onGetNotaRecepcionAgrupadaListPorUsuarioId(
    id,
    page,
    size
  ): Observable<PageInfo<NotaRecepcionAgrupada>> {
    return this.genericService.onCustomQuery(
      this.getNotaRecepcionAgrupadaListPorUsuarioId,
      { id, page, size }
    );
  }

  onSaveNotaRecepcionAgrupada(
    input: NotaRecepcionAgrupadaInput
  ): Observable<NotaRecepcionAgrupada> {
    return this.genericService.onSave(this.saveNotaRecepcionAgrupada, input);
  }

  onGetNotaRecepcionAgrupadaPorId(id): Observable<NotaRecepcionAgrupada>{
    return this.genericService.onGetById(this.notaRecepcionAgrupadaPorId, id);
  }

  onGetPedidoRecepcionProductoPorNotaRecepcionAgrupada(
    id: number,
    estado?: PedidoRecepcionProductoEstado,
    page: number = 0,
    size: number = 10
  ): Observable<PageInfo<PedidoRecepcionProductoDto>> {
    return this.genericService.onCustomQuery(
      this.getPedidoRecepcionProductoPorNotaRecepcionAgrupada,
      { id, estado, page, size }
    );
  }

   onGetPedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProducto(
    notaRecepcionAgrupadaId: number,
    productoId: number,
    estado?: PedidoRecepcionProductoEstado
  ): Observable<PedidoRecepcionProductoDto> {
    return this.genericService.onCustomQuery(
      this.getPedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProducto,
      { notaRecepcionAgrupadaId, productoId, estado }
    );
  }

   onRecepcionProductoNotaRecepcionAgrupada(
    notaRecepcionAgrupadaId: number,
    productoId: number,
    sucursalId: number,
    cantidad: number
  ): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.recepcionProductoNotaRecepcionAgrupada,
      { notaRecepcionAgrupadaId, productoId, sucursalId, cantidad }
    );
  }

   onFinalizarRecepcion(id: number): Observable<NotaRecepcionAgrupada> {
    return this.genericService.onCustomMutation(
      this.finalizarRecepcion,
      { id }
    );
  }

   onReabrirRecepcion(id: number): Observable<NotaRecepcionAgrupada> {
    return this.genericService.onCustomMutation(
      this.reabrirRecepcion,
      { id }
    );
  }

   onSolicitarPagoNotaRecepcionAgrupada(id: number): Observable<SolicitudPago> {
    return this.genericService.onCustomMutation(
      this.solicitarPagoNotaRecepcionAgrupada,
      { id }
    );
  }
}
