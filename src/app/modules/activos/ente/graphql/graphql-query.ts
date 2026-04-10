import gql from 'graphql-tag';

export const enteByIdQuery = gql`
  query ente($id: ID!) {
    data: ente(id: $id) {
      id
      tipoEnte
      referenciaId
      descripcion
      activo
      creadoEn
      usuario {
        id
        nickname
      }
    }
  }
`;

export const entesByTipoEnteQuery = gql`
  query entesByTipoEnte($tipoEnte: TipoEnte!) {
    data: entesByTipoEnte(tipoEnte: $tipoEnte) {
      id
      tipoEnte
      referenciaId
      descripcion
      activo
    }
  }
`;

export const enteByReferenciaIdQuery = gql`
  query enteByReferenciaId($tipoEnte: TipoEnte!, $referenciaId: ID!) {
    data: enteByReferenciaId(tipoEnte: $tipoEnte, referenciaId: $referenciaId) {
      id
      tipoEnte
      referenciaId
      descripcion
      activo
    }
  }
`;

export const enteSearchWithSummaryQuery = gql`
  query enteSearchWithSummary($texto: String, $sucursalId: ID, $tipoEnte: TipoEnte, $situacionPago: String, $estadoCuota: String, $page: Int, $size: Int) {
    data: enteSearchWithSummary(texto: $texto, sucursalId: $sucursalId, tipoEnte: $tipoEnte, situacionPago: $situacionPago, estadoCuota: $estadoCuota, page: $page, size: $size) {
      page {
        getTotalPages
        getTotalElements
        getNumberOfElements
        isFirst
        isLast
        hasNext
        hasPrevious
        getContent {
          id
          tipoEnte
          referenciaId
          activo
          creadoEn
          descripcion
          sucursalesConcatenadas
          sucursalIds
          montoTotal
          montoYaPagado
          montoPendiente
          cuotasTotales
          cuotasPagadas
          cuotasFaltantes
          diaVencimiento
          diasParaVencer
          estadoCuota
          situacionPago
          monedaSimbolo
          proveedorNombre
          usuario {
            id
            nickname
          }
        }
      }
      summary {
        totalBienes
        pagados
        enPago
        cuotasFaltantes
        totalGastado
        totalComprometido
        totalPendiente
        monedaPrincipal
      }
    }
  }
`;

export const entesSucursalesByEnteIdQuery = gql`
  query entesSucursalesByEnteId($enteId: ID!) {
    data: entesSucursalesByEnteId(enteId: $enteId) {
      id
      ente {
        id
        tipoEnte
        descripcion
      }
      sucursal {
        id
        nombre
      }
      responsable {
        id
        persona {
          nombre
        }
      }
      usuario {
        id
        nickname
      }
      creadoEn
    }
  }
`;

export const saveEnteSucursalMutation = gql`
  mutation saveEnteSucursal($entity: EnteSucursalInput!) {
    data: saveEnteSucursal(enteSucursal: $entity) {
      id
      ente {
        id
      }
      sucursal {
        id
      }
      usuario {
        id
        nickname
      }
    }
  }
`;

export const deleteEnteSucursalMutation = gql`
  mutation deleteEnteSucursal($id: ID!) {
    data: deleteEnteSucursal(id: $id)
  }
`;

export const saveEnteMutation = gql`
  mutation saveEnte($entity: EnteInput!) {
    data: saveEnte(ente: $entity) {
      id
      tipoEnte
      referenciaId
    }
  }
`;

export const deleteEnteMutation = gql`
  mutation deleteEnte($id: ID!) {
    data: deleteEnte(id: $id)
  }
`;

export const enteArchivosByEnteQuery = gql`
  query enteArchivosByEnte($enteId: ID!) {
    data: enteArchivosByEnte(enteId: $enteId) {
      id
      tipoArchivo
      url
      descripcion
      vigente
      creadoEn
      ente {
        id
      }
    }
  }
`;

export const saveEnteArchivoMutation = gql`
  mutation saveEnteArchivo($entity: EnteArchivoInput!) {
    data: saveEnteArchivo(enteArchivo: $entity) {
      id
      url
      tipoArchivo
    }
  }
`;

export const deleteEnteArchivoMutation = gql`
  mutation deleteEnteArchivo($id: ID!) {
    data: deleteEnteArchivo(id: $id)
  }
`;

export const enteSucursalSearchPageQuery = gql`
  query enteSucursalSearchPage($texto: String, $sucursalId: ID, $tipoEnte: TipoEnte, $responsableId: ID, $page: Int, $size: Int) {
    data: enteSucursalSearchPage(texto: $texto, sucursalId: $sucursalId, tipoEnte: $tipoEnte, responsableId: $responsableId, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        ente {
          id
          tipoEnte
          descripcion
          sucursalIds
          sucursalesConcatenadas
          montoTotal
          montoYaPagado
          montoPendiente
          cuotasTotales
          cuotasPagadas
          cuotasFaltantes
          diaVencimiento
          diasParaVencer
          estadoCuota
          situacionPago
          monedaSimbolo
          proveedorNombre
        }
        sucursal {
          id
          nombre
        }
        responsable {
          id
          persona {
            nombre
          }
        }
        usuario {
          id
          nickname
        }
        creadoEn
      }
    }
  }
`;
