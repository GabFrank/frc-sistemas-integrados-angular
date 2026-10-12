import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProcesoEtapaTipo } from './proceso-etapa.model';
import { ETAPA_ACTUAL_POR_PEDIDO } from './graphql/etapa-actual-por-pedido';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../../shared/services/timeout-link';

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
      fetchPolicy: 'network-only',
      // Corte propio y silencioso: los llamadores avisan en su error:
      context: { clientName: 'servidor', timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }
    }).pipe(
      map(result => result.data.etapaActualPorPedido)
    );
  }
} 