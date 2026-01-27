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

export const gpsQuery = gql`
  query gps($id: ID!) {
    data: gps(id: $id) {
      id
      imei
      modeloTracker
      simNumero
      activo
      creadoEm
      vehiculo {
        id
        chapa
      }
      ultimaTelemetria {
        id
        fechaGps
        latitud
        longitud
        velocidad
        direccion
        ignicion
        alarma
      }
    }
  }
`;

export const gpsListQuery = gql`
  query gpsList($page: Int, $size: Int) {
    data: gpsList(page: $page, size: $size) {
      id
      imei
      modeloTracker
      simNumero
      activo
      creadoEm
      vehiculo {
        id
        chapa
      }
      ultimaTelemetria {
        id
        fechaGps
        latitud
        longitud
        velocidad
        direccion
        ignicion
        alarma
      }
    }
  }
`;

export const gpsSearchQuery = gql`
  query gpsSearch($texto: String) {
    data: gpsSearch(texto: $texto) {
      id
      imei
      modeloTracker
      simNumero
      activo
      creadoEm
      vehiculo {
        id
        chapa
      }
      ultimaTelemetria {
        id
        fechaGps
        latitud
        longitud
        velocidad
        direccion
        ignicion
        alarma
      }
    }
  }
`;

export const gpsByVehiculoQuery = gql`
  query gpsByVehiculo($vehiculoId: ID!) {
    data: gpsByVehiculo(vehiculoId: $vehiculoId) {
      id
      imei
      modeloTracker
      simNumero
      activo
      creadoEm
      ultimaTelemetria {
        id
        latitud
        longitud
        velocidad
      }
    }
  }
`;

export const gpsByImeiQuery = gql`
  query gpsByImei($imei: String!) {
    data: gpsByImei(imei: $imei) {
      id
      imei
      modeloTracker
      simNumero
      activo
      creadoEm
      vehiculo {
        id
        chapa
      }
      ultimaTelemetria {
        id
        latitud
        longitud
        velocidad
      }
    }
  }
`;

export const saveGpsMutation = gql`
  mutation saveGps($entity: GpsInput!) {
    data: saveGps(gps: $entity) {
      id
      imei
      modeloTracker
      simNumero
      activo
      creadoEm
    }
  }
`;

export const deleteGpsMutation = gql`
  mutation deleteGps($id: ID!) {
    data: deleteGps(id: $id)
  }
`;
