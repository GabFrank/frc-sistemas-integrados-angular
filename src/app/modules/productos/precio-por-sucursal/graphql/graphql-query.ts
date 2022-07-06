import gql from 'graphql-tag';

export const preciosPorSucursalQuery = gql`
  query {
    data: preciosPorSucursal {
      id
      presentacion {
        id
      }
      sucursal {
        id
      }
      tipoPrecio {
        id
      }
      precio
    }
  }
`;

export const precioPorSucursalPorPresentacionId = gql`
  query ($id: Int) {
    data: precioPorSucursalPorPresentacionId(id: $id) {
      id
      tipoPrecio {
        id
        descripcion
      }
      precio
      principal
      activo
    }
  }
`;

export const savePrecioPorSucursal = gql`
  mutation savePrecioPorSucursal($entity: PrecioPorSucursalInput!) {
    data: savePrecioPorSucursal(precioPorSucursal: $entity) {
      id
      presentacion {
        id
      }
      sucursal {
        id
      }
      tipoPrecio {
        id
        descripcion
      }
      precio
      activo
      principal
    }
  }
`;

export const deletePrecioPorSucursalQuery = gql`
  mutation deletePrecioPorSucursal($id: ID!) {
    deletePrecioPorSucursal(id: $id)
  }
`;
