/**
 * Saca el mensaje que el backend mandó, sea cual sea la forma en que llegó el error.
 *
 * `GenericCrudService.onCustomMutation` hace `obs.error(res.errors)`: propaga el **array** de
 * errores de GraphQL, no un `Error`. Leer `err.message` ahí da `undefined` y el mensaje bueno se
 * pierde, dejando al usuario con un texto genérico que no dice nada.
 *
 * Eso importa acá más que en otros lados: los errores de este módulo son accionables — "ese cupón
 * ya fue registrado en la venta X", "ese cobro ya está vinculado a otro cupón" — y el cajero
 * necesita leerlos para saber qué hacer.
 */
export function mensajeDeError(err: any, fallback: string): string {
  if (!err) return fallback;

  // onCustomMutation / onCustomQuery: array de GraphQLError
  if (Array.isArray(err)) {
    const m = err.find((e) => e?.message)?.message;
    return m || fallback;
  }

  // ApolloError
  const graphQL = err.graphQLErrors;
  if (Array.isArray(graphQL) && graphQL.length) {
    const m = graphQL.find((e: any) => e?.message)?.message;
    if (m) return m;
  }

  return err.message || fallback;
}
