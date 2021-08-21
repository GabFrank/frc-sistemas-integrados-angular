import gql from 'graphql-tag';

export const preciosPorSucursalQuery = gql`
  query {
    data: preciosPorSucursal {
      id
      codigo {
        id
        codigo
        cantidad
        caja
        variacion
        principal
        activo
        tipoPrecio {
          id
          descripcion
          activo
        }
      }
      precio
    }
  }
`;

export const preciosPorSucursalPorCodigoId = gql`
  query ($id: Int) {
    data: precioPorSupreciosPorSucursalPorCodigoIdcursalSearch(id: $id) {
      id
      codigo {
        id
        codigo
        cantidad
        caja
        variacion
        principal
        activo
        tipoPrecio {
          id
          descripcion
          activo
        }
      }
      precio
    }
  }
`;

export const preciosPorSucursalPorSucursalId = gql`
  query ($id: ID!) {
    data: preciosPorSucursalPorSucursalId(id: $id) {
      id
      codigo {
        id
        codigo
        cantidad
        caja
        variacion
        principal
        activo
        tipoPrecio {
          id
          descripcion
          activo
        }
      }
      precio
    }
  }
`;

export const precioPorSucursalPorProductoId = gql`
  query ($id: Int) {
    data: precioPorSucursalPorProductoId(id: $id) {
      id
      codigo {
        id
        codigo
        cantidad
        caja
        variacion
        principal
        activo
        tipoPrecio {
          id
          descripcion
          activo
        }
      }
      precio
    }
  }
`;

export const savePrecioPorSucursal = gql`
  mutation savePrecioPorSucursal($entity: PrecioPorSucursalInput!) {
    data: savePrecioPorSucursal(precioPorSucursal: $entity) {
      id
      codigo {
        id
        codigo
        cantidad
        caja
        variacion
        principal
        activo
        tipoPrecio {
          id
          descripcion
          activo
        }
      }
      precio
    }
  }
`;

export const deletePrecioPorSucursalQuery = gql`
  mutation deletePrecioPorSucursal($id: ID!) {
    deletePrecioPorSucursal(id: $id)
  }
`;
