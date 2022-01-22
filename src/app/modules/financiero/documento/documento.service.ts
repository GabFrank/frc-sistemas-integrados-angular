import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Documento } from './documento.model';
import { AllDocumentosGQL } from './documentos';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {

  constructor(
    private genericService: GenericCrudService,
    private allDocumentos: AllDocumentosGQL
  ) { }

  onGetDocumentos(): Observable<Documento[]> {
    return this.genericService.onGetAll(this.allDocumentos);
  }
}
