import { ApolloLink, Observable, Operation } from "@apollo/client/core";
import { getMainDefinition } from "@apollo/client/utilities";

/** Tiempo máximo por defecto de una operación HTTP de GraphQL. */
export const TIMEOUT_POR_DEFECTO_MS = 60000;

export const MENSAJE_TIMEOUT_QUERY = "El servidor no respondió a tiempo.";
export const MENSAJE_TIMEOUT_MUTATION =
  "El servidor no respondió a tiempo: la operación pudo haberse aplicado. Verificá antes de reintentar.";

export type TipoOperacion = "query" | "mutation";

/**
 * Timeout real por operación (issue #304).
 *
 * Al vencer se desuscribe del resto de la cadena: el `HttpLink` de apollo-angular desuscribe su
 * `HttpClient`, que aborta el XHR. Recién entonces se avisa y se emite el error, así el aviso
 * coincide con lo que pasó. Una respuesta que llegue después se descarta.
 *
 * Cada llamada puede pedir más tiempo con `context: { timeoutMs }` (reportes, generación masiva).
 * Una consulta de fondo que nadie está esperando (el poll de cotización del header) pide
 * `context: { silenciarAvisoTimeout: true }`: el corte y el error siguen igual, pero no avisa.
 * Cortar del lado cliente no deshace lo que el servidor ya haya escrito: por eso una mutation
 * avisa distinto.
 */
export function crearTimeoutLink(
  avisar: (tipo: TipoOperacion) => void,
  porDefectoMs: number = TIMEOUT_POR_DEFECTO_MS
): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const pedido = operation.getContext()?.timeoutMs;
    const limiteMs = typeof pedido === "number" && pedido > 0 ? pedido : porDefectoMs;
    const tipo = tipoDeOperacion(operation);
    const silenciarAviso = operation.getContext()?.silenciarAvisoTimeout === true;

    return new Observable((observer) => {
      let terminado = false;
      let subscription: { unsubscribe(): void } = null;
      // El timer va antes del subscribe: un link que responde de forma sincrónica lo limpia al terminar.
      const timer = setTimeout(() => {
        if (terminado) return;
        terminado = true;
        subscription?.unsubscribe();
        if (!silenciarAviso) avisar(tipo);
        const err: any = new Error(tipo === "mutation" ? MENSAJE_TIMEOUT_MUTATION : MENSAJE_TIMEOUT_QUERY);
        err.esTimeout = true;
        observer.error(err);
      }, limiteMs);

      subscription = forward(operation).subscribe({
        next: (result) => {
          if (!terminado) observer.next(result);
        },
        error: (error) => {
          if (terminado) return;
          terminado = true;
          clearTimeout(timer);
          observer.error(error);
        },
        complete: () => {
          if (terminado) return;
          terminado = true;
          clearTimeout(timer);
          observer.complete();
        },
      });

      return () => {
        clearTimeout(timer);
        subscription?.unsubscribe();
      };
    });
  });
}

/** true si el error viene de este link (Apollo lo envuelve en `networkError`). */
export function esTimeoutDeLink(error: any): boolean {
  return error?.esTimeout === true || error?.networkError?.esTimeout === true;
}

function tipoDeOperacion(operation: Operation): TipoOperacion {
  const definicion = getMainDefinition(operation.query);
  return definicion.kind === "OperationDefinition" && definicion.operation === "mutation" ? "mutation" : "query";
}
