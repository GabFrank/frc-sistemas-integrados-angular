import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { localesDeSalidaQuery } from './graphql-query';

/** Sucursales que pueden ser local de salida de un traslado. */
@Injectable({ providedIn: 'root' })
export class LocalesDeSalidaGQL extends Query<any> {
  override document = localesDeSalidaQuery;
}
