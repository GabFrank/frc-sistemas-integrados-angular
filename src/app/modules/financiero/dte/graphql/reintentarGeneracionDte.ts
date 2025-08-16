import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { reintentarGeneracionDteMutation } from './graphql-query';
import { DocumentoElectronicoDto } from '../../dte/dte.service';

@Injectable({ providedIn: 'root' })
export class ReintentarGeneracionDteGQL extends Mutation<{ data: DocumentoElectronicoDto }> {
  document = reintentarGeneracionDteMutation;
}
