import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Penalizacion } from '../penalizacion.model';
import { penalizacionesPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class PenalizacionesPageGQL extends Query<PageInfo<Penalizacion>> { document = penalizacionesPageQuery; }
