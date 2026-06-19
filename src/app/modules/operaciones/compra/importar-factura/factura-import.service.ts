import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { ImportarFacturaProveedorGQL } from './graphql/importarFacturaProveedor';
import { FacturaImportPreviewGQL } from './graphql/facturaImportPreview';
import { ConfirmarFacturaImportGQL } from './graphql/confirmarFacturaImport';
import { FacturaProveedorImportsGQL } from './graphql/facturaProveedorImports';
import {
  ArchivoImportInput,
  ConfirmarFacturaImportItemInput,
  FacturaImportPage,
  FacturaImportPreview,
  FacturaProveedorImport,
} from './factura-import.model';

@Injectable({ providedIn: 'root' })
export class FacturaImportService {
  constructor(
    private generic: GenericCrudService,
    private importarGQL: ImportarFacturaProveedorGQL,
    private previewGQL: FacturaImportPreviewGQL,
    private confirmarGQL: ConfirmarFacturaImportGQL,
    private importsGQL: FacturaProveedorImportsGQL,
  ) {}

  /** Sube uno o varios archivos (paginas) y dispara la extraccion en central. */
  importar(archivos: ArchivoImportInput[], usuarioId: number): Observable<FacturaProveedorImport> {
    return this.generic
      .onCustomMutation(this.importarGQL, { archivos, usuarioId })
      .pipe(map((res) => res as FacturaProveedorImport));
  }

  /** Trae el preview con matching ejecutado (proveedor + productos sugeridos). */
  preview(id: number): Observable<FacturaImportPreview> {
    return this.generic
      .onCustomQuery(this.previewGQL, { id })
      .pipe(map((res) => res as FacturaImportPreview));
  }

  /** Confirma el import: crea el Pedido y aprende los alias. */
  confirmar(vars: {
    importId: number;
    proveedorId: number;
    items: ConfirmarFacturaImportItemInput[];
    tipoBoleta: string | null;
    crearPedido: boolean;
    usuarioId: number;
  }): Observable<FacturaProveedorImport> {
    return this.generic
      .onCustomMutation(this.confirmarGQL, vars)
      .pipe(map((res) => res as FacturaProveedorImport));
  }

  /** Historial paginado, filtrable por estado. */
  listar(estado: string | null, page: number, size: number): Observable<FacturaImportPage> {
    return this.generic
      .onCustomQuery(this.importsGQL, { estado, page, size })
      .pipe(map((res) => res as FacturaImportPage));
  }
}
