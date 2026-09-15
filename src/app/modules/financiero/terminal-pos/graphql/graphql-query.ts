import gql from "graphql-tag";

/**
 * ⚠️ DOS SETS DE CAMPOS, Y NO ES DUPLICACIÓN GRATUITA.
 *
 * El mismo servicio habla con los DOS backends, y sus tipos `TerminalPos` no son iguales: el ABM
 * vive en central, así que sólo ahí existen `sucursal` como objeto y `camposObligatoriosEfectivos`
 * (que central calcula). El filial tiene el espejo, con `sucursalId` pelado.
 *
 * GraphQL valida el documento ENTERO contra el schema: pedirle al filial un campo que no declara
 * rechaza la consulta completa, no ese campo. Con un set compartido, el PDV se quedaba sin poder
 * ni elegir la terminal.
 *
 * Mismo criterio que `formatosTerminalPosActivosCentralQuery`, que ya resolvía esto para formatos.
 */
const terminalPosFields = `
  id
  descripcion
  codigo
  serie
  sucursal { id nombre }
  cargaManualPermitida
  camposObligatorios
  camposObligatoriosEfectivos
  moneda { id denominacion simbolo }
  proveedorServicio {
    id
    nombreContacto
    numeroContacto
    persona { id nombre documento }
  }
  formatoTerminalPos {
    id
    nombre
    tipo
    patron
    mapeo
    activo
  }
  activo
  creadoEn
  usuario {
    id
    nickname
    persona { nombre }
  }
`;

/** Lo que el FILIAL puede servir. Ver el comentario de arriba. */
const terminalPosFieldsFilial = `
  id
  descripcion
  codigo
  serie
  sucursalId
  cargaManualPermitida
  camposObligatorios
  moneda { id denominacion simbolo }
  proveedorServicio {
    id
    nombreContacto
    numeroContacto
    persona { id nombre documento }
  }
  formatoTerminalPos {
    id
    nombre
    tipo
    patron
    mapeo
    activo
  }
  activo
  creadoEn
`;

export const terminalesPosQuery = gql`
  query ($page: Int, $size: Int) {
    data: terminalesPos(page: $page, size: $size) {
      ${terminalPosFields}
    }
  }
`;

export const terminalPosQuery = gql`
  query ($id: ID!) {
    data: terminalPos(id: $id) {
      ${terminalPosFields}
    }
  }
`;

export const searchTerminalPosQuery = gql`
  query ($texto: String) {
    data: searchTerminalPos(texto: $texto) {
      ${terminalPosFields}
    }
  }
`;

/**
 * El filtro del ABM, contra CENTRAL.
 *
 * El PDV usa `filterTerminalPosFilialQuery`, que pide sólo lo que el filial declara.
 */
export const filterTerminalPosQuery = gql`
  query ($descripcion: String, $codigo: String, $serie: String, $sucursalId: Int, $activo: Boolean, $page: Int, $size: Int) {
    data: filterTerminalPos(descripcion: $descripcion, codigo: $codigo, serie: $serie, sucursalId: $sucursalId, activo: $activo, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ${terminalPosFields}
      }
    }
  }
`;

/**
 * Las terminales activas con EXACTAMENTE esta serie.
 *
 * Búsqueda exacta y no `LIKE`, que es la del filtro de la pantalla: acá el valor viene del propio
 * cupón --texto libre capturado por el regex-- y quien llama lo acepta sin preguntarle nada al
 * cajero cuando hay uno solo. Un `%` o un `_` ahí adentro serían comodines de SQL y podrían
 * resolver contra la máquina equivocada.
 */
export const terminalesPosPorSerieQuery = gql`
  query terminalesPosPorSerie($serie: String!) {
    data: terminalesPosPorSerie(serie: $serie) {
      ${terminalPosFieldsFilial}
    }
  }
`;

/** El mismo filtro, con la forma que el FILIAL puede servir. Lo usa el PDV. */
export const filterTerminalPosFilialQuery = gql`
  query ($descripcion: String, $codigo: String, $serie: String, $sucursalId: Int, $activo: Boolean, $page: Int, $size: Int) {
    data: filterTerminalPos(descripcion: $descripcion, codigo: $codigo, serie: $serie, sucursalId: $sucursalId, activo: $activo, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ${terminalPosFieldsFilial}
      }
    }
  }
`;

export const saveTerminalPos = gql`
  mutation saveTerminalPos($entity: TerminalPosInput!) {
    data: saveTerminalPos(terminalPos: $entity) {
      ${terminalPosFields}
    }
  }
`;

export const deleteTerminalPosQuery = gql`
  mutation deleteTerminalPos($id: ID!) {
    deleteTerminalPos(id: $id)
  }
`;

/**
 * Saca el formato de una terminal.
 *
 * Es el **unico** camino para dejarla sin formato, y por lo tanto para bloquearle la venta con
 * tarjeta: `saveTerminalPos` no lo toca si el input no lo trae, justamente para que omitir un
 * campo no apague una caja. Desvincular tiene que costar un click deliberado.
 */
export const desasignarFormatoTerminalPosQuery = gql`
  mutation desasignarFormatoTerminalPos($terminalPosId: ID!) {
    data: desasignarFormatoTerminalPos(terminalPosId: $terminalPosId)
  }
`;

/**
 * Configuracion por aparato.
 *
 * Va aparte de `saveTerminalPos` porque las dos son tri-estado --`null` = hereda-- y aquella
 * mutation arma la entidad de cero: ahi apagar la configuracion de una terminal seria el efecto de
 * omitir un campo. Aca mandar la configuracion completa ES el contrato.
 *
 * El backend rechaza apagar la carga manual si es el ultimo camino que le queda a esa caja.
 */
export const configurarTerminalPosQuery = gql`
  mutation configurarTerminalPos($terminalPosId: ID!, $cargaManualPermitida: Boolean, $camposObligatorios: [String]) {
    data: configurarTerminalPos(terminalPosId: $terminalPosId, cargaManualPermitida: $cargaManualPermitida, camposObligatorios: $camposObligatorios) {
      ${terminalPosFields}
    }
  }
`;

export const countTerminalPosQuery = gql`
  {
    data: countTerminalPos
  }
`;
