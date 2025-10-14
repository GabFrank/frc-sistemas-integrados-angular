import { Injectable } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { SaveDocumentoElectronicoGQL } from "./graphql/saveDocumentoElectronico";
import { DocumentosElectronicosGQL } from "./graphql/documentosElectronicosQuery";
import { Observable } from "rxjs";
import { DocumentoElectronicoInput } from "./documento-electronico.model";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root',
})
export class DocumentoElectronicoService {


  constructor(

    private genericService: GenericCrudService,
    private saveDocumentoElectronico: SaveDocumentoElectronicoGQL,
    private getAllDocumentosElectronicos: DocumentosElectronicosGQL
  ) 
  {}

  onGetAllDocumentosElectronicos(page?, size?, servidor: boolean = true): Observable<any> {
    return this.genericService.onGetAll(this.getAllDocumentosElectronicos, page, size, servidor);
  }

  onSaveDocumentoElectronico(input: DocumentoElectronicoInput, servidor: boolean = true): Observable<any> {
    return this.genericService.onSave(this.saveDocumentoElectronico, input, null, null, servidor);
  }
}