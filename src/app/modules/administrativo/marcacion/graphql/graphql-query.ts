import gql from "graphql-tag";

const marcacionFragment = `
  id
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
    sucursalEntrada {
      id
      nombre
    }
  }
  marcacionSalida {
    id
    tipo
    fechaSalida
    sucursalSalida {
      id
      nombre
    }
  }
  minutosTrabajados
  minutosExtras
  minutosLlegadaTardia
  estado
  observacion
  actualizadoEn
`;

export const marcacionQuery = gql`
  query ($id: ID!) {
    data: marcacion(id: $id) {
      ${marcacionFragment}
    }
  }
`;

export const marcacionesQuery = gql`
  query ($page: Int, $size: Int) {
    data: marcaciones(page: $page, size: $size) {
      ${marcacionFragment}
    }
  }
`;

export const marcacionesPorUsuarioQuery = gql`
  query ($usuarioId: ID!, $fechaInicio: String, $fechaFin: String, $page: Int, $size: Int) {
    data: marcacionesPorUsuario(usuarioId: $usuarioId, fechaInicio: $fechaInicio, fechaFin: $fechaFin, page: $page, size: $size) {
      ${marcacionFragment}
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
  query ($id: ID!) {
    data: jornada(id: $id) {
      ${jornadaFragment}
    }
  }
`;

export const jornadasQuery = gql`
  query ($page: Int, $size: Int) {
    data: jornadas(page: $page, size: $size) {
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
