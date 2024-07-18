import gql from "graphql-tag";

export const pedidosQuery = gql`
  {
    pedido {
      id
      proveedor {
        persona {
          nombre
        }
      }
      nombreProveedor
      formaPago {
        id
        descripcion
      }
      estado
      moneda {
        denominacion
        simbolo
      }
      plazoCredito
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      nombreUsuario
      descuento
      valorTotal
    }
  }
`;

export const pedidosResumidoQuery = gql`
  {
    data: pedidos {
      id
      proveedor {
        id
        persona {
          nombre
        }
      }
      formaPago {
        id
        descripcion
      }
      estado
      moneda {
        id
        denominacion
        simbolo
      }
      plazoCredito
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      descuento
      valorTotal
    }
  }
`;

export const pedidosSearch = gql`
  query ($texto: String) {
    data: pedidoSearch(texto: $texto) {
      id
      proveedor {
        persona {
          nombre
        }
      }
      nombreProveedor
      formaPago {
        id
        descripcion
      }
      estado
      moneda {
        denominacion
        simbolo
      }
      plazoCredito
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      nombreUsuario
      descuento
      valorTotal
    }
  }
`;

export const pedidoQuery = gql`
  query ($id: ID!) {
    data: pedido(id: $id) {
      id
      proveedor {
        persona {
          nombre
        }
      }
      nombreProveedor
      formaPago
      estado
      moneda {
        denominacion
        simbolo
      }
      plazoCredito
      creadoEn
      usuario {
        persona {
          nombre
        }
      }
      nombreUsuario
      descuento
      valorTotal
    }
  }
`;

export const savePedido = gql`
  mutation savePedido($entity: PedidoInput!) {
    data: savePedido(entity: $entity) {
      id
    }
  }
`;

export const deletePedidoQuery = gql`
  mutation deletePedido($id: ID!) {
    deletePedido(id: $id)
  }
`;

export const filterPedidosQuery = gql`
  query filterPedidos(
    $estado: PedidoEstado
    $sucursalId: Int
    $inicio: String
    $fin: String
    $proveedorId: Int
    $vendedorId: Int
    $formaPago: FormaPago
    $productoId: Int
  ) {
    data: filterPedidos(
      estado: $estado
      sucursalId: $sucursalId
      inicio: $inicio
      fin: $fin
      proveedorId: $proveedorId
      vendedorId: $vendedorId
      formaPago: $formaPago
      productoId: $productoId
    ) {
      id
      proveedor {
        id
        persona {
          nombre
        }
      }
      vendedor {
        id
        persona {
          nombre
        }
      }
      nombreProveedor
      formaPago {
        id
        descripcion
      }
      estado
      moneda {
        id
        denominacion
        simbolo
      }
      plazoCredito
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      nombreUsuario
      descuento
      valorTotal
    }
  }
`;

export const pedidoInfoCompletaQuery = gql`
  query ($id: ID!) {
    data: pedido(id: $id) {
      id
      cantPedidoItem
      compra {
        id
        estado
      }
      proveedor {
        id
        persona {
          nombre
        }
      }
      vendedor {
        id
        persona {
          nombre
        }
      }
      formaPago {
        id
        descripcion
      }
      estado
      moneda {
        id
        denominacion
      }
      plazoCredito
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      descuento
      valorTotal
      tipoBoleta
      sucursalInfluenciaList {
        id
        sucursal {
          id
          nombre
        }
      }
      sucursalEntregaList {
        id
        sucursal {
          id
          nombre
        }
      }
      fechaEntregaList {
        fechaEntrega
      }
      notaRecepcionList {
        id
        numero
        tipoBoleta
        cantidadItens
        valor
        pedido {
          id
        }
        compra {
          id
        }
      }
    }
  }
`;

// pedidoItemPorPedidoIdSobrante
export const pedidoItemPorPedidoIdSobranteQuery = gql`
  query ($id: ID!, $page: Int, $size: Int) {
    data: pedidoItemPorPedidoIdSobrante(id: $id, page: $page, size: $size) {
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
          presentaciones {
            id
            cantidad
          }
          codigoPrincipal
        }
        presentacion {
          id
          cantidad
        }
        pedido {
          id
        }
        precioUnitario
        descuentoUnitario
        bonificacion
        bonificacionDetalle
        estado
        vencimiento
        creadoEn
        cantidad
        valorTotal
      }
    }
  }
`;

export const pedidoItemPorNotaRecepcionQuery = gql`
  query ($id: ID!, $page: Int, $size: Int) {
    data: pedidoItemPorNotaRecepcion(id: $id, page: $page, size: $size) {
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
          presentaciones {
            id
            cantidad
          }
          codigoPrincipal
        }
        presentacion {
          id
          cantidad
        }
        pedido {
          id
        }
        precioUnitario
        descuentoUnitario
        bonificacion
        bonificacionDetalle
        estado
        vencimiento
        creadoEn
        cantidad
        valorTotal
      }
    }
  }
`;

export const pedidoItemPorPedidoPageQuery = gql`
  query ($id: ID!, $page: Int, $size: Int) {
    data: pedidoItemPorPedidoPage(id: $id, page: $page, size: $size) {
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
          presentaciones {
            id
            cantidad
          }
          codigoPrincipal
        }
        presentacion {
          id
          cantidad
        }
        pedido {
          id
        }
        precioUnitario
        descuentoUnitario
        bonificacion
        bonificacionDetalle
        estado
        vencimiento
        creadoEn
        cantidad
        valorTotal
      }
    }
  }
`;

export const updateNotaRecepcionQuery = gql`
  mutation updateNotaRecepcion($pedidoItemId: ID!, $notaRecepcionId: ID) {
    data: updateNotaRecepcion(
      pedidoItemId: $pedidoItemId
      notaRecepcionId: $notaRecepcionId
    ) {
      id
      notaRecepcion {
        id
      }
    }
  }
`;

export const addPedidoItemListToNotaRecepcionQuery = gql`
  mutation addPedidoItemListToNotaRecepcion(
    $notaRecepcion: ID
    $pedidoItemIdList: [ID]
  ) {
    data: addPedidoItemListToNotaRecepcion(
      notaRecepcion: $notaRecepcion
      pedidoItemIdList: $pedidoItemIdList
    )
  }
`;

export const savePedidoFull = gql`
  mutation savePedidoFull(
    $entity: PedidoInput!
    $fechaEntregaList: [String]
    $sucursalEntregaList: [Int]
    $sucursalInfluenciaList: [Int]
    $usuarioId: Int
  ) {
    data: savePedidoFull(
      entity: $entity
      fechaEntregaList: $fechaEntregaList
      sucursalEntregaList: $sucursalEntregaList
      sucursalInfluenciaList: $sucursalInfluenciaList
      usuarioId: $usuarioId
    ) {
      id
    }
  }
`;

// pedido:PedidoInput!, fechaEntregaList: [String], sucursalEntregaList: [Int], sucursalInfluenciaList: [Int], usuarioId: Int
