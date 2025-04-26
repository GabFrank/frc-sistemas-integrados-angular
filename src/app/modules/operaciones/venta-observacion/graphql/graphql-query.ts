import gql from "graphql-tag";
export const ventaObservacionesQuery = gql`
  {
    data: ventaObservaciones {
      id
      descripcion
      motivoObservacion {
        id
        descripcion
      }
      venta {
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

export const ventaObservacionQuery = gql`
  query ($id: ID!) {
    data: ventaObservacion(id: $id) {
      id
      descripcion
      motivoObservacion {
        id
        descripcion
      }
      venta {
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

export const findByVentaAndSucursalIdQuery = gql`
  query ($ventaId: Int!, $sucId: Int!) {
    data: findByVentaIdAndSucursalId(ventaId: $ventaId, sucId: $sucId) {
      id
      descripcion
      motivoObservacion {
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

export const saveVentaObservacionQuery = gql`
  mutation saveVentaObservacion($entity: VentaObservacionInput!) {
    data: saveVentaObservacion(ventaObservacion: $entity) {
      id
      descripcion
      motivoObservacion {
        id
      }
      creadoEn
      usuario {
        id
      }
      sucursal {
        id
      }
      venta {
        id
      }
    }
  }
`;

export const deleteVentaObservacionQuery = gql`
  mutation deleteVentaObservacion($id: ID!) {
    deleteVentaObservacion(id: $id)
  }
`;