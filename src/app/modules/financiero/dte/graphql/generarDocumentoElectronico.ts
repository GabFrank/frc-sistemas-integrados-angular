import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { generarDocumentoElectronicoMutation } from './graphql-query';
import { DocumentoElectronicoDto } from '../../dte/dte.service';

@Injectable({ providedIn: 'root' })
export class GenerarDocumentoElectronicoGQL extends Mutation<{ data: DocumentoElectronicoDto }> {
  document = generarDocumentoElectronicoMutation;
}


