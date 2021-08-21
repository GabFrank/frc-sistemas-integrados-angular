import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Contacto } from '../contacto';
import { contactosSearchByTelefonoOrNombre } from './graphql-query';

export interface Response {
  contactos: Contacto[];
}


@Injectable({
  providedIn: 'root',
})
export class ContactosSearchByTelefonoOrNombreGQL extends Query<Response> {
  document = contactosSearchByTelefonoOrNombre;
}
