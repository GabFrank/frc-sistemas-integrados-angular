import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProcesoEtapaTipo } from './proceso-etapa.model';
import { ETAPA_ACTUAL_POR_PEDIDO } from './graphql/etapa-actual-por-pedido';

@Injectable({
  providedIn: 'root'
})
export class ProcesoEtapaService {

  constructor(private apollo: Apollo) { }

  onGetEtapaActual(pedidoId: number): Observable<ProcesoEtapaTipo> {
    return this.apollo.query<{ etapaActualPorPedido: ProcesoEtapaTipo }>({
      query: ETAPA_ACTUAL_POR_PEDIDO,
      variables: {
        pedidoId: pedidoId
      },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.etapaActualPorPedido)
    );
  }
} 