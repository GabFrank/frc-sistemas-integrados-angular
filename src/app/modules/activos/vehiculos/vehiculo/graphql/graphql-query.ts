import gql from 'graphql-tag';

export const vehiculoByIdQuery = gql`
  query vehiculo($id: ID!) {
    data: vehiculo(id: $id) {
      id
      chapa
      color
      anho
      documentacion
      refrigerado
      nuevo
      fechaAdquisicion
      primerKilometraje
      capacidadKg
      capacidadPasajeros
      imagenesVehiculo
      imagenesDocumentos
      creadoEn
      modelo {
        id
        descripcion
        marca {
          id
          descripcion
        }
      }
      tipoVehiculo {
        id
        descripcion
      }
      usuario {
        id
        nickname
      }
    }
  }
`;

export const vehiculosSearchWithPageQuery = gql`
  query vehiculoSearchWithPage($texto: String, $page: Int, $size: Int) {
    data: vehiculoSearchWithPage(texto: $texto, page: $page, size: $size) {
      id
      chapa
      color
      anho
      modelo {
        id
        descripcion
        marca {
          id
          descripcion
        }
      }
      tipoVehiculo {
        id
        descripcion
      }
    }
  }
`;

export const vehiculosSearchPageQuery = gql`
  query vehiculoSearchPage($texto: String, $page: Int, $size: Int) {
    data: vehiculoSearchPage(texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        chapa
        color
        anho
        modelo {
          id
          descripcion
          marca {
            id
            descripcion
          }
        }
        tipoVehiculo {
          id
          descripcion
        }
      }
    }
  }
`;

export const countVehiculoQuery = gql`
  query {
    data: countVehiculo
  }
`;

export const saveVehiculoMutation = gql`
  mutation saveVehiculo($entity: VehiculoInput!) {
    data: saveVehiculo(vehiculo: $entity) {
      id
      chapa
    }
  }
`;

export const deleteVehiculoMutation = gql`
  mutation deleteVehiculo($id: ID!) {
    data: deleteVehiculo(id: $id)
  }
`;

export const vehiculosSucursalByVehiculoQuery = gql`
  query vehiculosSucursalByVehiculo($vehiculoId: ID!) {
    data: vehiculosSucursalByVehiculo(vehiculoId: $vehiculoId) {
      id
      creadoEn
      vehiculo {
        id
        chapa
      }
      sucursal {
        id
        nombre
      }
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      usuario {
        id
        nickname
      }
    }
  }
`;

export const saveVehiculoSucursalMutation = gql`
  mutation saveVehiculoSucursal($entity: VehiculoSucursalInput!) {
    data: saveVehiculoSucursal(vehiculoSucursal: $entity) {
      id
      creadoEn
      vehiculo {
        id
        chapa
      }
      sucursal {
        id
        nombre
      }
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      usuario {
        id
        nickname
      }
    }
  }
`;

export const deleteVehiculoSucursalMutation = gql`
  mutation deleteVehiculoSucursal($id: ID!) {
    data: deleteVehiculoSucursal(id: $id)
  }
`;

export const vehiculosSucursalQuery = gql`
  query vehiculosSucursal($page: Int, $size: Int) {
    data: vehiculosSucursal(page: $page, size: $size) {
      id
      creadoEn
      vehiculo {
        id
        chapa
        modelo {
          id
          descripcion
          marca {
            id
            descripcion
          }
        }
      }
      sucursal {
        id
        nombre
      }
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      usuario {
        id
        nickname
      }
    }
  }
`;

export const vehiculosSucursalBySucursalQuery = gql`
  query vehiculosSucursalBySucursal($sucursalId: ID!) {
    data: vehiculosSucursalBySucursal(sucursalId: $sucursalId) {
      id
      creadoEn
      vehiculo {
        id
        chapa
        modelo {
          id
          descripcion
          marca {
            id
            descripcion
          }
        }
      }
      sucursal {
        id
        nombre
      }
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      usuario {
        id
        nickname
      }
    }
  }
`;

export const vehiculosSucursalSearchPageQuery = gql`
  query vehiculosSucursalSearchPage($sucursalId: ID, $responsableId: ID, $page: Int, $size: Int) {
    data: vehiculosSucursalSearchPage(sucursalId: $sucursalId, responsableId: $responsableId, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        creadoEn
        vehiculo {
          id
          chapa
          modelo {
            id
            descripcion
            marca {
              id
              descripcion
            }
          }
        }
        sucursal {
          id
          nombre
        }
        responsable {
          id
          persona {
            id
            nombre
          }
        }
        usuario {
          id
          nickname
        }
      }
    }
  }
`;
