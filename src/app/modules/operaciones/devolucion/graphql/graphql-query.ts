import gql from "graphql-tag";

const devolucionItemFields = `
  id
  producto {
    id
    descripcion
    codigoPrincipal
  }
  presentacion {
    id
    descripcion
    cantidad
  }
  motivoAveria {
    id
    descripcion
    generaGasto
    aplicaProveedor
  }
  recepcionMercaderiaItem {
    id
  }
  cantidad
  lote
  motivo
  vencimiento
  costoUnitario
  cantidadReingresada
  vencimientoReingreso
`;

const devolucionFields = `
  id
  tipo
  estado
  identificador
  resolucion
  nroNotaCredito
  montoAcreditado
  motivo
  observacion
  fecha
  creadoEn
  finalizado
  proveedor {
    id
    persona {
      id
      nombre
    }
  }
  sucursalOrigen {
    id
    nombre
  }
  sucursalUbicacion {
    id
    nombre
  }
  colectadoEn
  usuario {
    id
    persona {
      nombre
    }
  }
`;

export const devolucionQuery = gql`
  query ($id: ID!) {
    data: devolucion(id: $id) {
      ${devolucionFields}
      items {
        ${devolucionItemFields}
      }
    }
  }
`;

export const devolucionConFiltrosQuery = gql`
  query (
    $proveedorId: ID
    $sucursalId: ID
    $estado: DevolucionEstado
    $fechaInicio: String
    $fechaFin: String
    $page: Int
    $size: Int
  ) {
    data: devolucionConFiltros(
      proveedorId: $proveedorId
      sucursalId: $sucursalId
      estado: $estado
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      page: $page
      size: $size
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
      getContent {
        ${devolucionFields}
      }
    }
  }
`;

export const devolucionesPendientesPorProveedorQuery = gql`
  query ($proveedorId: ID!) {
    data: devolucionesPendientesPorProveedor(proveedorId: $proveedorId) {
      ${devolucionFields}
    }
  }
`;

export const devolucionItemsPorDevolucionQuery = gql`
  query ($devolucionId: ID!) {
    data: devolucionItemsPorDevolucion(devolucionId: $devolucionId) {
      ${devolucionItemFields}
    }
  }
`;

export const motivosAveriaActivosQuery = gql`
  query {
    data: motivosAveriaActivos {
      id
      descripcion
      activo
      generaGasto
      aplicaProveedor
    }
  }
`;

export const saveDevolucionMutation = gql`
  mutation saveDevolucion($entity: DevolucionInput!) {
    data: saveDevolucion(entity: $entity) {
      ${devolucionFields}
      items {
        ${devolucionItemFields}
      }
    }
  }
`;

export const saveDevolucionItemMutation = gql`
  mutation saveDevolucionItem($entity: DevolucionItemInput!) {
    data: saveDevolucionItem(entity: $entity) {
      ${devolucionItemFields}
    }
  }
`;

export const deleteDevolucionItemMutation = gql`
  mutation deleteDevolucionItem($id: ID!) {
    data: deleteDevolucionItem(id: $id)
  }
`;

export const avanzarEstadoDevolucionMutation = gql`
  mutation avanzarEstadoDevolucion(
    $devolucionId: ID!
    $estado: DevolucionEstado!
    $usuarioId: ID
  ) {
    data: avanzarEstadoDevolucion(
      devolucionId: $devolucionId
      estado: $estado
      usuarioId: $usuarioId
    ) {
      ${devolucionFields}
    }
  }
`;

export const acreditarDevolucionMutation = gql`
  mutation acreditarDevolucion(
    $devolucionId: ID!
    $nroNotaCredito: String
    $montoAcreditado: Float
    $usuarioId: ID
  ) {
    data: acreditarDevolucion(
      devolucionId: $devolucionId
      nroNotaCredito: $nroNotaCredito
      montoAcreditado: $montoAcreditado
      usuarioId: $usuarioId
    ) {
      ${devolucionFields}
    }
  }
`;

export const cancelarDevolucionMutation = gql`
  mutation cancelarDevolucion(
    $devolucionId: ID!
    $motivoCancelacion: String
  ) {
    data: cancelarDevolucion(
      devolucionId: $devolucionId
      motivoCancelacion: $motivoCancelacion
    ) {
      ${devolucionFields}
    }
  }
`;
