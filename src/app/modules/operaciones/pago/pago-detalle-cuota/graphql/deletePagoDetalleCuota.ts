import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deletePagoDetalleCuota } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeletePagoDetalleCuotaGQL extends Mutation<boolean> {
  document = deletePagoDetalleCuota;
} 