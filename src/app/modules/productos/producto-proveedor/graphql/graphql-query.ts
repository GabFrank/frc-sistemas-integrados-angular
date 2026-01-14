import gql from "graphql-tag";

export const productoProveedorPorProductoId = gql`
  query ($id: ID!, $page: Int, $size: Int) {
    data: productoProveedorPorProductoId(id: $id, page: $page, size: $size) {
      id
      producto {
        id
        descripcion
      }
      proveedor {
        id
        persona {
          id
          nombre
        }
      }
      pedido {
        id
      }
      creadoEn
      usuario {
        id
      }
    }
  }
`;

export const productoProveedorPorProveedorId = gql`
  query ($id: ID!, $texto: String, $page: Int, $size: Int) {
    data: productoProveedorPorProveedorId(id: $id, texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        producto {
          id
          descripcion
          descripcionFactura
          codigoPrincipal
          precioPrincipal
          vencimiento
          presentaciones {
            id
            descripcion
            principal
            cantidad
            activo
            codigos {
              id
              codigo
              principal
              activo
            }
            tipoPresentacion {
              id
              descripcion
            }
          }
          costo {
            ultimoPrecioCompra
          }
        }
        proveedor {
          id
          persona {
            id
            nombre
          }
        }
        pedido {
          id
        }
        creadoEn
        usuario {
          id
        }
        activo
        motivoDesvinculacion
      }
    }
  }
`;

export const desvincularProductoProveedor = gql`
  mutation desvincularProductoProveedor($id: ID!, $motivo: String!) {
    data: desvincularProductoProveedor(id: $id, motivo: $motivo) {
      id
      activo
      motivoDesvinculacion
    }
  }
`;
