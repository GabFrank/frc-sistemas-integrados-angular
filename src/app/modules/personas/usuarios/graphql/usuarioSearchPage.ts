import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Usuario } from '../usuario.model';
import { usuariosSearchPage } from './graphql-query';

class Response {
  data: PageInfo<Usuario>;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioSearchPageGQL extends Query<Response> {
  document = usuariosSearchPage;
}

