import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { InicioSesion } from '../../../configuracion/inicio-sesion/inicio-sesion.model';
import { inicioSesionListPorUsuarioIdAndAbiertoGQL } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class InicioSesionListPorUsuarioIdAndAbiertoGQL extends Query<PageInfo<InicioSesion>> {
  document = inicioSesionListPorUsuarioIdAndAbiertoGQL;
}
