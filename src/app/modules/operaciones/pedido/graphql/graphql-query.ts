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
      cantPedidoItem
      cantPedidoItemCancelados
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
      // Estos se mantienen por ahora, pero su lógica de creación cambiará.
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
      // La lista de notas de recepción ya no se devuelve directamente al guardar el pedido.
      // notaRecepcionList {
      //   id
      //   numero
      //   tipoBoleta
      //   fecha
      //   cantidadItens
      //   valor
      //   pedido {
      //     id
      //   }
      //   compra {
      //     id
      //   }
      // }
      
      # Step tracking fields (REMOVED)
      # usuarioCreacion {
      #   id
      #   persona {
      #     nombre
      #   }
      # }
      # fechaInicioCreacion
      # fechaFinCreacion
      # progresoCreacion
      # 
      # usuarioRecepcionNota {
      #   id
      #   persona {
      #     nombre
      #   }
      # }
      # fechaInicioRecepcionNota
      # fechaFinRecepcionNota
      # progresoRecepcionNota
      # 
      # usuarioRecepcionMercaderia {
      #   id
      #   persona {
      #     nombre
      #   }
      # }
      # fechaInicioRecepcionMercaderia
      # fechaFinRecepcionMercaderia
      # progresoRecepcionMercaderia
      # 
      # usuarioSolicitudPago {
      #   id
      #   persona {
      #     nombre
      #   }
      # }
      # fechaInicioSolicitudPago
      # fechaFinSolicitudPago
      # progresoSolicitudPago

      # NUEVO: La lista de etapas del proceso
      procesoEtapaList {
        id
        tipoEtapa
        estadoEtapa
        fechaInicio
        fechaFin
        usuario {
          id
          persona {
            nombre
          }
        }
      }
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
    $idPedido: ID
    $numeroNotaRecepcion: Int
    $estado: PedidoEstado
    $sucursalId: Int
    $inicio: String
    $fin: String
    $proveedorId: Int
    $vendedorId: Int
    $formaPagoId: Int
    $productoId: Int
    $page: Int
    $size: Int
  ) {
    data: filterPedidos(
      idPedido: $idPedido
      numeroNotaRecepcion: $numeroNotaRecepcion
      estado: $estado
      sucursalId: $sucursalId
      inicio: $inicio
      fin: $fin
      proveedorId: $proveedorId
      vendedorId: $vendedorId
      formaPagoId: $formaPagoId
      productoId: $productoId
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
        id
        cantPedidoItem
        cantPedidoItemCancelados
        pagado
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
      }
    }
  }
`;

export const pedidoInfoCompletaQuery = gql`
  query pedidoInfoCompleta($id: ID!) {
    data: pedido(id: $id) {
      id
      cantPedidoItem
      cantPedidoItemCancelados
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
      
      # NUEVO: La lista de etapas del proceso
      procesoEtapaList {
        id
        tipoEtapa
        estadoEtapa
        fechaInicio
        fechaFin
        usuario {
          id
          persona {
            nombre
          }
        }
      }

      pedidoItens {
        ...PedidoItemRefactorFragment
      }

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
    }
  }
  ${PedidoItemRefactorFragment}
`;

export const pedidoInfoDetallesQuery = gql`
  query ($id: ID!) {
    data: pedido(id: $id) {
      id
      cantPedidoItem
      descuento
      valorTotal
      cantPedidoItemSinNota
      cantPedidoItemCancelados
    }
  }
`;

// FRAGMENTO REUTILIZABLE PARA PEDIDO ITEM SIMPLIFICADO
export const PedidoItemRefactorFragment = gql`
  fragment PedidoItemRefactorFragment on PedidoItem {
    id
    producto {
      id
      descripcion
      presentaciones {
        id
        cantidad
      }
      codigoPrincipal
      imagenPrincipal
    }
    presentacion {
      id
      cantidad
    }
    cantidad
    precioUnitario
    descuentoUnitario
    valorTotal
    observacion
    vencimientoEsperado // NUEVO
    cancelado
  }
`;


// pedidoItemPorPedidoIdSobrante
export const pedidoItemPorPedidoIdSobranteQuery = gql`
  query ($id: ID!, $page: Int, $size: Int, $texto: String) {
    data: pedidoItemPorPedidoIdSobrante(
      id: $id
      page: $page
      size: $size
      texto: $texto
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ...PedidoItemRefactorFragment
      }
    }
  }
  ${PedidoItemRefactorFragment}
`;

export const getPedidoItemPorId = gql`
  query ($id: ID!) {
    data: pedidoItem(id: $id) {
      ...PedidoItemRefactorFragment
    }
  }
  ${PedidoItemRefactorFragment}
`;

export const onPedidoItemPorPedidoId = gql`
  query ($id: ID!, $page: Int, $size: Int, $texto: String) {
    data: onPedidoItemPorPedidoId(
      id: $id
      page: $page
      size: $size
      texto: $texto
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        ...PedidoItemRefactorFragment
      }
    }
  }
  ${PedidoItemRefactorFragment}
`;

export const onPedidoItemPorPedidoIdAndProductoId = gql`
  query ($pedidoId: ID!, $productoId: ID!) {
    data: onPedidoItemPorPedidoIdAndProductoId(
      pedidoId: $pedidoId
      productoId: $productoId
    ) {
      ...PedidoItemRefactorFragment
    }
  }
  ${PedidoItemRefactorFragment}
`;

// NUEVA MUTACIÓN
export const finalizarCreacionPedido = gql`
  mutation finalizarCreacionPedido($id: ID!) {
    data: finalizarCreacionPedido(id: $id)
  }
`;

export const pedidoItemQuery = gql`
  query ($id: ID!) {
    data: pedidoItem(id: $id) {
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
      presentacionCreacion {
        id
        cantidad
      }
      pedido {
        id
      }
      precioUnitarioCreacion
      descuentoUnitarioCreacion
      bonificacion
      bonificacionDetalle
      estado
      vencimientoCreacion
      creadoEn
      cantidadCreacion
      valorTotal
      pedidoItemSucursalList {
        id
        sucursal {
          id
          nombre
        }
        sucursalEntrega {
          id
          nombre
        }
        cantidadPorUnidad
        cantidadPorUnidadRecibida
        creadoEn
        usuario {
          id
          persona {
            nombre
          }
        }
      }
    }
  }
`;

export const pedidoItemPedidoItemSucursalListQuery = gql`
  query ($id: ID!) {
    data: pedidoItem(id: $id) {
      pedidoItemSucursalList {
        id
        sucursal {
          id
          nombre
        }
        sucursalEntrega {
          id
          nombre
        }
        cantidadPorUnidad
        cantidadPorUnidadRecibida
        creadoEn
        usuario {
          id
          persona {
            nombre
          }
        }
      }
    }
  }
`;

export const verificarDistribucionSucursalesQuery = gql`
  query ($id: ID!) {
    data: verificarDistribucionSucursales(id: $id)
  }
`;

export const pedidoRecepcionMercaderiaSummaryQuery = gql`
  query ($id: ID!) {
    data: pedidoRecepcionMercaderiaSummary(id: $id) {
      totalItems
      verificados
      pendientes
      sucursales
    }
  }
`;
