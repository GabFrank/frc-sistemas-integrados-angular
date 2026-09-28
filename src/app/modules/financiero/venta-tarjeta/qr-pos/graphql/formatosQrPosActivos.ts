import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { formatosQrPosActivosQuery } from './graphql-query';
import { FormatoQrPos } from '../formato-qr-pos.model';

export interface FormatosQrPosActivosResponse {
  data: FormatoQrPos[];
}

@Injectable({ providedIn: 'root' })
export class FormatosQrPosActivosGQL extends Query<FormatosQrPosActivosResponse> {
  document = formatosQrPosActivosQuery;
}
