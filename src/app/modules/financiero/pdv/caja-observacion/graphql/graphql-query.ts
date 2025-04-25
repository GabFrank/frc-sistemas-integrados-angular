import gql from "graphql-tag";
export const cajaObservacionesQuery = gql`
  {
    data: cajaObservaciones {
      id
      descripcion
      cajaMotivoObservacion {
        id
        descripcion
      }
      pdvCaja {
        id
      }
      creadoEn
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

export const cajaObservacionQuery = gql`
  query ($id: ID!) {
    data: cajaObservacion(id: $id) {
      id
      descripcion
      cajaMotivoObservacion {
        id
        descripcion
      }
      pdvCaja {
        id
      }
      creadoEn
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

export const findByPdvCajaIdAndSucursalIdQuery = gql`
  query ($cajaId: Int!, $sucursalId: Int!) {
    data: findByPdvCajaIdAndSucursalId(cajaId: $cajaId, sucursalId: $sucursalId) {
      id
      descripcion
      cajaMotivoObservacion {
        id
        descripcion
      }
      sucursal {
        id
        nombre
      }
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
    }
  }
`;

export const saveCajaObservacionQuery = gql`
  mutation saveCajaObservacion($entity: CajaObservacionInput!) {
    data: saveCajaObservacion(cajaObservacion: $entity) {
      id
      descripcion
      cajaMotivoObservacion {
        id
      }
      creadoEn
      usuario {
        id
      }
      sucursal {
        id
      }
      pdvCaja {
        id
      }
    }
  }
`;

export const deleteCajaObservacionQuery = gql`
  mutation deleteCajaObservacion($id: ID!) {
    deleteCajaObservacion(id: $id)
  }
`;