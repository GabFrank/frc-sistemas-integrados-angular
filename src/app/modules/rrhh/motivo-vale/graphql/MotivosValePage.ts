import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { MotivoVale } from '../motivo-vale.model';
import { motivosValePageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class MotivosValePageGQL extends Query<PageInfo<MotivoVale>> { document = motivosValePageQuery; }
