import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Producto } from '../producto.model';
import { saveImagenProductoQuery, saveProducto } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveImagenProductoGQL extends Mutation<boolean> {
  document = saveImagenProductoQuery;
}
