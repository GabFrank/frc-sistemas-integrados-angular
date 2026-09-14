// Prefijo que graphql-java antepone a toda excepción lanzada por un resolver:
// "Exception while fetching data (/data) : <mensaje real>". El path entre paréntesis varía.
const PREFIJO_GRAPHQL_JAVA = /^Exception while fetching data \([^)]*\) : /;

/**
 * Quita el envoltorio de graphql-java y deja el mensaje de negocio que escribió el backend.
 * Cualquier otro formato (o un valor que no es string) se devuelve tal cual: el llamador ya
 * tiene su propio fallback, y reventar acá dentro de un subscribe sería peor que el prefijo.
 */
export function limpiarMensajeGraphQL(msg: any): any {
  if (typeof msg !== "string") return msg;
  return msg.replace(PREFIJO_GRAPHQL_JAVA, "").trim();
}

/**
 * Copia de los errores de una respuesta GraphQL con el `message` limpio. No muta el original y
 * conserva el resto de las propiedades (`path`, `locations`, `extensions`).
 */
export function limpiarErroresGraphQL(errors: any): any {
  if (!Array.isArray(errors)) return errors;
  return errors.map((e) =>
    e != null && typeof e === "object"
      ? { ...e, message: limpiarMensajeGraphQL(e.message) }
      : e
  );
}
