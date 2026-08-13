import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { LiquidacionSueldo } from '../liquidacion.model';
import { liquidacionesPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class LiquidacionesPageGQL extends Query<PageInfo<LiquidacionSueldo>> { document = liquidacionesPageQuery; }
