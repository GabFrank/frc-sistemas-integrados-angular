import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { limpiarMensajeGraphQL } from '../../../commons/core/utils/graphqlErrorUtils';
import { NumerosInutilizadosGQL } from './graphql/numerosInutilizados';
import { ProximosNumerosChequeGQL } from './graphql/proximosNumerosCheque';
import { InutilizarNumeroChequeGQL } from './graphql/inutilizarNumeroCheque';
import { RevertirInutilizacionGQL } from './graphql/revertirInutilizacion';

const AL_CENTRAL = { clientName: 'servidor' };

export type AccionChequeInutilizado = 'NINGUNA' | 'ANULADO' | 'RENUMERADO';

export interface NumeroInutilizado {
  id: number;
  numero: number;
  motivo: string;
  creadoEn: Date;
  accionCheque: AccionChequeInutilizado;
  numeroNuevo?: number;
  revertidoEn?: Date;
  usuario?: { persona?: { nombre?: string } };
  revertidoPor?: { persona?: { nombre?: string } };
  cheque?: { id: number; numero: number; estado: string; beneficiario?: string; total?: number };
  chequera?: { id: number; nombre?: string };
}

/**
 * Numeración de las chequeras (central #603, desk #720): próximos números libres e inutilizar o revertir un número.
 * Las mutations emiten error con el mensaje limpio del central si lo rechaza.
 */
@Injectable({ providedIn: 'root' })
export class NumeracionChequeraService {

  constructor(
    private numerosInutilizadosGQL: NumerosInutilizadosGQL,
    private proximosNumerosChequeGQL: ProximosNumerosChequeGQL,
    private inutilizarGQL: InutilizarNumeroChequeGQL,
    private revertirGQL: RevertirInutilizacionGQL,
  ) {}

  /** Inutilizaciones de una chequera (o las vigentes de todas, sin id). Error = lista vacía. */
  onGetInutilizados(chequeraId: number | null): Observable<NumeroInutilizado[]> {
    return this.numerosInutilizadosGQL.fetch({ chequeraId }, { fetchPolicy: 'no-cache', errorPolicy: 'all', context: AL_CENTRAL })
      .pipe(map(r => (r?.data?.data || []) as NumeroInutilizado[]), catchError(() => of([])));
  }

  /** Los próximos N números libres. null si no se pudo leer (quien llama cae a su proyección). */
  onGetProximos(chequeraId: number, cantidad: number): Observable<number[] | null> {
    return this.proximosNumerosChequeGQL.fetch({ chequeraId, cantidad },
      { fetchPolicy: 'no-cache', errorPolicy: 'all', context: AL_CENTRAL })
      .pipe(map(r => r?.errors?.length ? null : ((r?.data?.data || []) as number[])), catchError(() => of(null)));
  }

  onInutilizar(vars: { chequeraId: number; numero: number; motivo: string; accionCheque?: AccionChequeInutilizado;
                       numeroNuevo?: number | null }): Observable<NumeroInutilizado> {
    return this.mutar(this.inutilizarGQL, vars);
  }

  onRevertir(id: number): Observable<NumeroInutilizado> {
    return this.mutar(this.revertirGQL, { id });
  }

  private mutar(gql: any, variables: any): Observable<any> {
    return gql.mutate(variables, { fetchPolicy: 'no-cache', errorPolicy: 'all', context: AL_CENTRAL }).pipe(map((res: any) => {
      if (res?.errors?.length) throw new Error(limpiarMensajeGraphQL(res.errors[0].message) || 'No se pudo completar la operación');
      return res?.data?.data;
    }));
  }
}
