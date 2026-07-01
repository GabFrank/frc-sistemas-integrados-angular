import gql from 'graphql-tag';

export const buscarProductoInteligenteQuery = gql`
  query buscarProductoInteligente(
    $texto: String!
    $proveedorId: ID
    $activo: Boolean
    $page: Int
    $size: Int
  ) {
    data: buscarProductoInteligente(
      texto: $texto
      proveedorId: $proveedorId
      activo: $activo
      page: $page
      size: $size
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        codigoCoincidente
        tipoCoincidencia
        producto {
          id
          descripcion
          descripcionFactura
          codigoPrincipal
          precioPrincipal
          vencimiento
          balanza
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
            cotizacion
            moneda {
              id
              denominacion
              simbolo
              cambio
            }
          }
        }
      }
    }
  }
`;

export const productoProveedorBusquedaInteligenteQuery = gql`
  query productoProveedorBusquedaInteligente(
    $id: ID!
    $texto: String!
    $page: Int
    $size: Int
    $pedidoId: ID
  ) {
    data: productoProveedorBusquedaInteligente(
      id: $id
      texto: $texto
      page: $page
      size: $size
      pedidoId: $pedidoId
    ) {
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
            cotizacion
            moneda {
              id
              denominacion
              simbolo
              cambio
            }
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
        yaEnPedido
      }
    }
  }
`;
