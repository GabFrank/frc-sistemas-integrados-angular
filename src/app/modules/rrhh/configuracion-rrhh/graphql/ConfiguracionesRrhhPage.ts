import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { ConfiguracionRrhh } from '../configuracion-rrhh.model';
import { configuracionesRrhhPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ConfiguracionesRrhhPageGQL extends Query<PageInfo<ConfiguracionRrhh>> {
  document = configuracionesRrhhPageQuery;
}
