import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PrestamoCuota } from '../prestamo.model';
import { cobrarCuotaMutation } from './graphql-query';

export interface Response { data: PrestamoCuota; }

@Injectable({ providedIn: 'root' })
export class CobrarCuotaGQL extends Mutation<Response> { document = cobrarCuotaMutation; }
