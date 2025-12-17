import gql from "graphql-tag";

export const modificacionesPorSchemaQuery = gql`
  query (
    $schemaNombre: String!
    $inicio: Date!
    $fin: Date!
    $page: Int
    $size: Int
  ) {
    data: modificacionesPorSchema(
      schemaNombre: $schemaNombre
      inicio: $inicio
      fin: $fin
      page: $page
      size: $size
    ) {
      content {
        id
        tipoEntidad
        entidadId
        entidadSucursalId
        schemaNombre
        tablaNombre
        tipoOperacion
        modificadoEn
        creadoEn
        ipAddress
        userAgent
        observacion
        activo
        usuario {
          id
          nickname
          persona {
            id
            nombre
          }
        }
        sucursal {
          id
          nombre
        }
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`;

export const modificacionesPorTipoEntidadQuery = gql`
  query (
    $tipoEntidad: String!
    $page: Int
    $size: Int
  ) {
    data: modificacionesPorTipoEntidad(
      tipoEntidad: $tipoEntidad
      page: $page
      size: $size
    ) {
      content {
        id
        tipoEntidad
        entidadId
        entidadSucursalId
        schemaNombre
        tablaNombre
        tipoOperacion
        modificadoEn
        creadoEn
        ipAddress
        userAgent
        observacion
        activo
        usuario {
          id
          nickname
          persona {
            id
            nombre
          }
        }
        sucursal {
          id
          nombre
        }
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`;

export const modificacionesPorTipoEntidadAndSchemaQuery = gql`
  query (
    $tipoEntidad: String!
    $schemaNombre: String!
    $inicio: Date!
    $fin: Date!
    $page: Int
    $size: Int
  ) {
    data: modificacionesPorTipoEntidadAndSchema(
      tipoEntidad: $tipoEntidad
      schemaNombre: $schemaNombre
      inicio: $inicio
      fin: $fin
      page: $page
      size: $size
    ) {
      content {
        id
        tipoEntidad
        entidadId
        entidadSucursalId
        schemaNombre
        tablaNombre
        tipoOperacion
        modificadoEn
        creadoEn
        ipAddress
        userAgent
        observacion
        activo
        usuario {
          id
          nickname
          persona {
            id
            nombre
          }
        }
        sucursal {
          id
          nombre
        }
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`;

export const modificacionRegistroQuery = gql`
  query ($id: ID!) {
    data: modificacionRegistro(id: $id) {
      id
      tipoEntidad
      entidadId
      entidadSucursalId
      schemaNombre
      tablaNombre
      tipoOperacion
      modificadoEn
      creadoEn
      ipAddress
      userAgent
      observacion
      activo
      usuario {
        id
        nickname
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const detallesModificacionQuery = gql`
  query ($modificacionRegistroId: Int!) {
    data: detallesModificacion(modificacionRegistroId: $modificacionRegistroId) {
      id
      campoNombre
      campoTipo
      valorAnterior
      valorNuevo
      valorAnteriorId
      valorNuevoId
      orden
      esCampoSensible
    }
  }
`;

