import gql from "graphql-tag";

const marcacionFragment = `
  id
  sucursalId
  usuario {
    id
    persona {
      nombre
    }
  }
  tipo
  latitud
  longitud
  precisionGps
  distanciaSucursalMetros
  deviceId
  deviceInfo
  sucursalEntrada {
    id
    nombre
  }
  fechaEntrada
  sucursalSalida {
    id
    nombre
  }
  fechaSalida
  autorizacion
  codigo
`;

const jornadaFragment = `
  id
  sucursalId
  usuario {
    id
    persona {
      nombre
    }
  }
  fecha
  marcacionEntrada {
    id
    tipo
    fechaEntrada
    fechaSalida
    sucursalEntrada {
      id
      nombre
    }
  }
  marcacionSalidaAlmuerzo {
    id
    tipo
    fechaEntrada
    fechaSalida
  }
  marcacionEntradaAlmuerzo {
    id
    tipo
    fechaEntrada
    fechaSalida
  }
  marcacionSalida {
    id
    tipo
    fechaEntrada
    fechaSalida
    sucursalSalida {
      id
      nombre
    }
  }
  minutosTrabajados
  minutosExtras
  minutosLlegadaTardia
  minutosLlegadaTardiaAlmuerzo
  turno
  estado
  observacion
  actualizadoEn
`;

export const marcacionQuery = gql`
  query ($id: ID!, $sucursalId: ID!) {
    data: marcacion(id: $id, sucursalId: $sucursalId) {
      ${marcacionFragment}
    }
  }
`;

export const marcacionesQuery = gql`
  query ($fechaInicio: String, $fechaFin: String, $page: Int, $size: Int) {
    data: marcaciones(fechaInicio: $fechaInicio, fechaFin: $fechaFin, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ${marcacionFragment}
      }
    }
  }
`;

export const marcacionesPorUsuarioQuery = gql`
  query ($usuarioId: ID!, $fechaInicio: String, $fechaFin: String, $page: Int, $size: Int) {
    data: marcacionesPorUsuario(usuarioId: $usuarioId, fechaInicio: $fechaInicio, fechaFin: $fechaFin, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ${marcacionFragment}
      }
    }
  }
`;

export const saveMarcacionMutation = gql`
  mutation saveMarcacion($entity: MarcacionInput!) {
    data: saveMarcacion(marcacion: $entity) {
      ${marcacionFragment}
    }
  }
`;

export const deleteMarcacionMutation = gql`
  mutation deleteMarcacion($id: ID!) {
    data: deleteMarcacion(id: $id)
  }
`;

export const jornadaQuery = gql`
  query ($id: ID!, $sucursalId: ID!) {
    data: jornada(id: $id, sucursalId: $sucursalId) {
      ${jornadaFragment}
    }
  }
`;

export const jornadasQuery = gql`
  query ($fechaInicio: String, $fechaFin: String, $page: Int, $size: Int) {
    data: jornadas(fechaInicio: $fechaInicio, fechaFin: $fechaFin, page: $page, size: $size) {
      ${jornadaFragment}
    }
  }
`;

export const jornadasPorUsuarioQuery = gql`
  query ($usuarioId: ID!, $fechaInicio: String, $fechaFin: String) {
    data: jornadasPorUsuario(usuarioId: $usuarioId, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      ${jornadaFragment}
    }
  }
`;

export const imprimirReporteMarcacionesQuery = gql`
  query ($usuarioId: ID, $fechaInicio: String, $fechaFin: String, $usuarioResponsableId: ID) {
    data: imprimirReporteMarcaciones(
      usuarioId: $usuarioId
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      usuarioResponsableId: $usuarioResponsableId
    )
  }
`;
