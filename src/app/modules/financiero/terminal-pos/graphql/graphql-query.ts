import gql from "graphql-tag";

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
