import gql from "graphql-tag";

export const gpsQuery = gql`
  query gps($id: ID!) {
    data: gps(id: $id) {
      id
      imei
      modeloTracker
      simNumero
      activo
      creadoEm
      modoSueno
      intervaloReporte
      motorBloqueado
      alertaVelocidad
      velocidadLimite
      alertaVibracion
      alertaBateriaBaja
      alertaAcc
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
      modoSueno
      intervaloReporte
      motorBloqueado
      alertaVelocidad
      velocidadLimite
      alertaVibracion
      alertaBateriaBaja
      alertaAcc
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
      ultimaLatitud
      ultimaLongitud
      ultimaFechaReporte
      ultimaIgnicion
      ultimaVelocidad
      modoSueno
      intervaloReporte
      motorBloqueado
      alertaVelocidad
      velocidadLimite
      alertaVibracion
      alertaBateriaBaja
      alertaAcc
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
      ultimaLatitud
      ultimaLongitud
      ultimaFechaReporte
      ultimaIgnicion
      ultimaVelocidad
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
      ultimaTelemetria {
        id
        latitud
        longitud
        velocidad
        ignicion
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

export const enviarComandoGpsMutation = gql`
  mutation enviarComandoGps($id: ID!, $tipo: String!, $valor: String) {
    data: enviarComandoGps(id: $id, tipo: $tipo, valor: $valor)
  }
`;

export const guardarConfigAlertasGpsMutation = gql`
  mutation guardarConfigAlertasGps($id: ID!, $alertaVelocidad: Boolean, $velocidadLimite: Int, $alertaVibracion: Boolean, $alertaBateriaBaja: Boolean, $alertaAcc: Boolean) {
    data: guardarConfigAlertasGps(id: $id, alertaVelocidad: $alertaVelocidad, velocidadLimite: $velocidadLimite, alertaVibracion: $alertaVibracion, alertaBateriaBaja: $alertaBateriaBaja, alertaAcc: $alertaAcc) {
      id
      alertaVelocidad
      velocidadLimite
      alertaVibracion
      alertaBateriaBaja
      alertaAcc
    }
  }
`;
