import gql from 'graphql-tag';

export const enteByIdQuery = gql`
  query ente($id: ID!) {
    data: ente(id: $id) {
      id
      tipoEnte
      referenciaId
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
      activo
    }
  }
`;

export const enteSearchPageQuery = gql`
  query enteSearchPage($texto: String, $sucursalId: ID, $page: Int, $size: Int) {
    data: enteSearchPage(texto: $texto, sucursalId: $sucursalId, page: $page, size: $size) {
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
