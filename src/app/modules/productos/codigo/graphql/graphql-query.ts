import gql from 'graphql-tag';

export const codigosQuery = gql`
  {
    id
    codigo
    activo
    tipoPrecio {
      id
      descripcion
      activo
      autorizacion
    }
    producto {
      id
    }
    cantidad
    caja
    preciosPorSucursal {
      sucursal {
        id
      }
      precio
    }
  }
`;

// export const codigoPorProductoId = gql
// `
// `

export const codigoPorCodigo = gql`
  query ($texto: String) {
    data: codigoPorCodigo(texto: $texto) {
      id
      codigo
      activo
      tipoPrecio {
        id
        descripcion
        activo
        autorizacion
      }
      producto {
        id
        descripcion
        balanza
        garantia
        combo
        promocion
        imagenPrincipal
      }
      cantidad
      caja
      preciosPorSucursal {
        sucursal {
          id
        }
        precio
      }
    }
  }
`;

export const codigoPorProductoId = gql`
  query ($id: Int) {
    data: codigoPorProductoId(id: $id) {
      id
      activo
      producto {
        id
      }
      codigo
      caja
      cantidad
      principal
      variacion
      tipoPrecio {
        id
        descripcion
      }
      referenciaCodigo {
        id
        codigo
      }
    }
  }
`;

export const codigoQuery = gql`
  query ($id: ID!) {
    data: codigo(id: $id) {
      id
      activo
      codigo
      tipoPrecio {
        id
        descripcion
        activo
        autorizacion
      }
      producto {
        id
      }
      cantidad
      caja
      preciosPorSucursal {
        sucursal {
          id
        }
        precio
      }
    }
  }
`;

export const saveCodigo = gql`
  mutation saveCodigo($entity: CodigoInput!) {
    data: saveCodigo(codigo: $entity) {
      id
      activo
      producto {
        id
      }
      codigo
      caja
      cantidad
      principal
      variacion
      tipoPrecio {
        id
        descripcion
      }
      referenciaCodigo {
        id
        codigo
      }
    }
  }
`;

export const deleteCodigoQuery = gql`
  mutation deleteCodigo($id: ID!) {
    deleteCodigo(id: $id)
  }
`;
