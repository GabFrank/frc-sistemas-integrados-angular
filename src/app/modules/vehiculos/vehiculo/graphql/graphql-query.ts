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
