import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import {
  desactivarFormatoQrPosMutation,
  formatosQrPosQuery,
  saveFormatoQrPosMutation,
} from './graphql-query';
import { FormatoQrPos } from '../formato-qr-pos.model';

@Injectable({ providedIn: 'root' })
export class FormatosQrPosGQL extends Query<{ data: FormatoQrPos[] }> {
  document = formatosQrPosQuery;
}

@Injectable({ providedIn: 'root' })
export class SaveFormatoQrPosGQL extends Mutation<{ data: FormatoQrPos }> {
  document = saveFormatoQrPosMutation;
}

@Injectable({ providedIn: 'root' })
export class DesactivarFormatoQrPosGQL extends Mutation<{ data: boolean }> {
  document = desactivarFormatoQrPosMutation;
}
