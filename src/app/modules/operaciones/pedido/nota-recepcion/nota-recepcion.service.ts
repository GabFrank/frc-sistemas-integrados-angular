import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { DeleteNotaRecepcionGQL } from "./graphql/deleteNotaRecepcion";
import { NotaRecepcionPorIdGQL } from "./graphql/getNotaRecepcionPorId";
import { NotaRecepcionPorPedidoIdGQL } from "./graphql/notaRecepcionPorPedidoId";
import { SaveNotaRecepcionGQL } from "./graphql/saveNotaRecepcion";
import { NotaRecepcion, NotaRecepcionInput } from "./nota-recepcion.model";


@Injectable({
  providedIn: "root",
})
export class NotaRecepcionService {
  constructor(
    private genericService: GenericCrudService,
    private getNotaRecepcion: NotaRecepcionPorIdGQL,
    private getnotaRecepcionPorPedidoId: NotaRecepcionPorPedidoIdGQL,
    private saveNotaRecepcion: SaveNotaRecepcionGQL,
    private deleteNotaRecepcion: DeleteNotaRecepcionGQL,
  ) {}

  onGetNotaRecepcion(id): Observable<NotaRecepcion> {
    return this.genericService.onGetById(this.getNotaRecepcion, id);
  }
  onGetNotaRecepcionPorPedidoId(id): Observable<NotaRecepcion[]> {
    return this.genericService.onGetById(this.getnotaRecepcionPorPedidoId, id);
  }
  onSaveNotaRecepcion(input: NotaRecepcionInput): Observable<NotaRecepcion> {
    return this.genericService.onSave(this.saveNotaRecepcion, input);
  }
  onDeleteNotaRecepcion(id): Observable<boolean> {
    return this.genericService.onDelete(this.deleteNotaRecepcion, id);
  }

}
