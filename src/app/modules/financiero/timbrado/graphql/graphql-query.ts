import gql from "graphql-tag";

export const timbradoQuery = gql`
  query ($id: ID!) {
    data: timbrado(id: $id) {
      id
      razonSocial
      ruc
      numero
      fechaInicio
      fechaFin
      isElectronico
      csc
      cscId
      email
      tipoSociedad
      domicilioFiscalDepartamento
      domicilioFiscalCiudad
      domicilioFiscalCodigoCiudad
      domicilioFiscalLocalidad
      domicilioFiscalBarrio
      domicilioFiscalDireccion
      telefono
      codActividadEconomicaPrincipal
      descActividadEconomicaPrincipal
      listCodigoActividadEconomicaSecundaria
      listDescripcionActividadEconomicaSecundaria
      activo
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const timbradosQuery = gql`
  query {
    data: timbrados(page: $page, size: $size) {
     id
      razonSocial
      ruc
      numero
      fechaInicio
      fechaFin
      isElectronico
      csc
      cscId
      email
      tipoSociedad
      domicilioFiscalDepartamento
      domicilioFiscalCiudad
      domicilioFiscalCodigoCiudad
      domicilioFiscalLocalidad
      domicilioFiscalBarrio
      domicilioFiscalDireccion
      telefono
      codActividadEconomicaPrincipal
      descActividadEconomicaPrincipal
      listCodigoActividadEconomicaSecundaria
      listDescripcionActividadEconomicaSecundaria
      activo
      creadoEn
      usuario {
        id
      }
    }
}`; 

export const timbradoDetallesQuery = gql`
  query ($page: Int, $size: Int) {
    data: timbradoDetalles(page: $page, size: $size) {
      id
      timbrado {
        id
      }
      puntoDeVenta {
        id
      }
      puntoExpedicion
      cantidad
      rangoDesde
      rangoHasta
      numeroActual
      activo
      creadoEn
      departamento
      ciudad
      codigoCiudad
      localidad
      barrio
      direccion
      telefono
      usuario {
        id
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const timbradosSearchQuery = gql`
  query ($texto: String) {
    data: timbradosSearch(texto: $texto) {
      id
      razonSocial
      ruc
      numero
      fechaInicio
      fechaFin
      isElectronico
      csc
      cscId
      email
      tipoSociedad
      domicilioFiscalDepartamento
      domicilioFiscalCiudad
      domicilioFiscalCodigoCiudad
      domicilioFiscalLocalidad
      domicilioFiscalBarrio
      domicilioFiscalDireccion
      telefono
      codActividadEconomicaPrincipal
      descActividadEconomicaPrincipal
      listCodigoActividadEconomicaSecundaria
      listDescripcionActividadEconomicaSecundaria
      activo
      creadoEn
      usuario {
        id
        nickname
      }
    }
  }
`; 

export const timbradoDetalleQuery = gql`
  query ($id: ID!) {
    data: timbradoDetalle(id: $id) {
      id
      timbrado {
        id
      }
      puntoDeVenta {
        id
      }
      puntoExpedicion
      cantidad
      rangoDesde
      rangoHasta
      numeroActual
      activo
      creadoEn
      departamento
      ciudad
      codigoCiudad
      localidad
      barrio
      direccion
      telefono
      usuario {
        id
        nickname
      }
      sucursal {
        id
        nombre
      }
    }
  }
`;

export const findByNumeroQuery = gql`
  query ($numero: String, $page: Int, $size: Int) {
    data: findByNumero(numero: $numero, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
      id
      razonSocial
      ruc
      numero
      fechaInicio
      fechaFin
      isElectronico
      csc
      cscId
      email
      tipoSociedad
      domicilioFiscalDepartamento
      domicilioFiscalCiudad
      domicilioFiscalCodigoCiudad
      domicilioFiscalLocalidad
      domicilioFiscalBarrio
      domicilioFiscalDireccion
      telefono
      codActividadEconomicaPrincipal
      descActividadEconomicaPrincipal
      listCodigoActividadEconomicaSecundaria
      listDescripcionActividadEconomicaSecundaria
      activo
      creadoEn
      usuario {
        id
        }
      }
    }
  }
`;

export const saveTimbradoQuery = gql`
  mutation saveTimbrado($entity: TimbradoInput!) {
    data: saveTimbrado(timbrado: $entity) {
      id
    }
  }
`;

export const deleteTimbradoQuery = gql`
  mutation deleteTimbrado($id: ID!) {
    data: deleteTimbrado(id: $id)
  }
`;

export const existeTimbradoActivoQuery = gql`
  query existeTimbradoActivo($excludeId: ID) {
    data: existeTimbradoActivo(excludeId: $excludeId)
  }
`;

export const timbradoDetallesByTimbradoIdQuery = gql`
  query ($timbradoId: ID!, $page: Int, $size: Int) {
    data: findTimbradoDetallesByTimbradoId(timbradoId: $timbradoId, page: $page, size: $size) {
      getTotalPages
      getTotalElements  
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        timbrado {
          id
        }
        puntoDeVenta {
          id
          nombre
        }
        puntoExpedicion
        cantidad
        rangoDesde
        rangoHasta
        numeroActual
        sucursal {
          id
          nombre
        }
        activo
        creadoEn
        departamento
        ciudad
        codigoCiudad
        localidad
        barrio
        direccion
        telefono
        usuario {
          id
        }
      }
    }
  }
`;

export const timbradoDetallesBySucursalIdQuery = gql`
  query ($sucursalId: ID!) {
    data: timbradoDetallesBySucursalId(sucursalId: $sucursalId) {
      id
      timbrado {
        id
        numero
        isElectronico
        activo
      }
      puntoDeVenta {
        id
        nombre
      }
      puntoExpedicion
      cantidad
      rangoDesde
      rangoHasta
      numeroActual
      sucursal {
        id
        nombre
      }
      activo
      creadoEn
      departamento
      ciudad
      codigoCiudad
      localidad
      barrio
      direccion
      telefono
      usuario {
        id
      }
    }
  }
`;

export const saveTimbradoDetalleQuery = gql`
  mutation saveTimbradoDetalle($entity: TimbradoDetalleInput!) {
    data: saveTimbradoDetalle(timbradoDetalle: $entity) {
      id
    }
  }
`;

export const deleteTimbradoDetalleQuery = gql`
  mutation deleteTimbradoDetalle($id: ID!) {
    data: deleteTimbradoDetalle(id: $id)
  }
`;

