import { Mutation } from "apollo-angular";
import { saveDocumentoElectronicoMutation } from "./graphql-query";
import { Injectable } from "@angular/core";
import { DocumentoElectronico } from "../documento-electronico.model";

export interface Response {
  data: DocumentoElectronico;
}

@Injectable({
  providedIn: 'root',
})
export class SaveDocumentoElectronicoGQL extends Mutation<Response>{
  document = saveDocumentoElectronicoMutation;
}