import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { Vale } from '../vale.model';
import { valesPageQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ValesPageGQL extends Query<PageInfo<Vale>> { document = valesPageQuery; }
