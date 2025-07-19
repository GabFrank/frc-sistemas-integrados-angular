import gql from "graphql-tag";

// ===== QUERIES =====

export const pedidoQuery = gql`
  query ($id: ID!) {
    data: pedido(id: $id) {
      id
      vendedor {
        id
        persona {
          nombre
          documento
        }
      }
      proveedor {
        id
        persona {
          nombre
          documento
        }
      }
      formaPago {
        id
        descripcion
      }
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
      sucursalEntregaList {
        sucursal {
          id
          nombre
        }
      }
      sucursalInfluenciaList {
        sucursal {
          id
          nombre
        }
      }
    }
  }
`;

export const pedidosQuery = gql`
  query ($page: Int!, $size: Int!) {
    data: pedidos(page: $page, size: $size) {
      id
      vendedor {
        id
        persona {
          nombre
          documento
        }
      }
      proveedor {
        id
        persona {
          nombre
          documento
        }
      }
      formaPago {
        id
        descripcion
      }
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
    }
  }
`;

export const etapaActualDelPedidoQuery = gql`
  query ($pedidoId: ID!) {
    data: etapaActualDelPedido(pedidoId: $pedidoId)
  }
`;

// ===== MUTATIONS =====

export const savePedidoMutation = gql`
  mutation savePedido($input: PedidoInput!) {
    data: savePedido(input: $input) {
      id
      vendedor {
        id
        persona {
          nombre
          documento
        }
      }
      proveedor {
        id
        persona {
          nombre
          documento
        }
      }
      formaPago {
        id
        descripcion
      }
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
    }
  }
`;
// those are the inputs: entity:PedidoInput!, fechaEntregaList: [String], sucursalEntregaList: [Int], sucursalInfluenciaList: [Int], usuarioId: Int
export const savePedidoFullMutation = gql`
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
      vendedor {
        id
        persona {
          nombre
          documento
        }
      }
      proveedor {
        id
        persona {
          nombre
          documento
        }
      }
      formaPago {
        id
        descripcion
      }
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
      sucursalEntregaList {
        sucursal {
          id
          nombre
        }
      }
      sucursalInfluenciaList {
        sucursal {
          id
          nombre
        }
      }
    }
  }
`;

export const finalizarCreacionPedidoMutation = gql`
  mutation finalizarCreacionPedido($pedidoId: ID!) {
    data: finalizarCreacionPedido(pedidoId: $pedidoId) {
      id

      creadoEn
    }
  }
`;

export const deletePedidoMutation = gql`
  mutation deletePedido($id: ID!) {
    data: deletePedido(id: $id)
  }
`;

// ===== PEDIDO ITEM DISTRIBUCION QUERIES =====

export const pedidoItemDistribucionQuery = gql`
  query ($id: ID!) {
    data: pedidoItemDistribucion(id: $id) {
      id
      pedidoItem {
        id
        cantidadSolicitada
        distribucionConcluida
        producto {
          id
          descripcion
        }
      }
      sucursalInfluencia {
        id
        nombre
        direccion
      }
      sucursalEntrega {
        id
        nombre
        direccion
      }
      cantidadAsignada
    }
  }
`;

export const pedidoItemDistribucionesByPedidoItemIdQuery = gql`
  query ($pedidoItemId: ID!) {
    data: pedidoItemDistribucionPorPedidoItem(pedidoItemId: $pedidoItemId) {
      id
      pedidoItem {
        id
        cantidadSolicitada
        distribucionConcluida
        producto {
          id
          descripcion
        }
      }
      sucursalInfluencia {
        id
        nombre
        direccion
      }
      sucursalEntrega {
        id
        nombre
        direccion
      }
      cantidadAsignada
    }
  }
`;

export const pedidoItemDistribucionesBySucursalIdQuery = gql`
  query ($sucursalId: ID!) {
    data: pedidoItemDistribucionPorSucursal(sucursalId: $sucursalId) {
      id
      pedidoItem {
        id
        cantidadSolicitada
        distribucionConcluida
        producto {
          id
          descripcion
        }
      }
      sucursalInfluencia {
        id
        nombre
        direccion
      }
      sucursalEntrega {
        id
        nombre
        direccion
      }
      cantidadAsignada
    }
  }
`;

export const pedidoItemDistribucionesBySucursalInfluenciaIdQuery = gql`
  query ($sucursalId: ID!) {
    data: pedidoItemDistribucionPorSucursalInfluencia(sucursalId: $sucursalId) {
      id
      pedidoItem {
        id
        cantidadSolicitada
        distribucionConcluida
        producto {
          id
          descripcion
        }
      }
      sucursalInfluencia {
        id
        nombre
        direccion
      }
      sucursalEntrega {
        id
        nombre
        direccion
      }
      cantidadAsignada
    }
  }
`;

export const countPedidoItemDistribucionQuery = gql`
  query {
    data: countPedidoItemDistribucion
  }
`;

// ===== PEDIDO ITEM DISTRIBUCION MUTATIONS =====

export const savePedidoItemDistribucionMutation = gql`
  mutation savePedidoItemDistribucion($entity: PedidoItemDistribucionInput!) {
    data: savePedidoItemDistribucion(entity: $entity) {
      id
      pedidoItem {
        id
        cantidadSolicitada
        distribucionConcluida
        producto {
          id
          descripcion
        }
      }
      sucursalInfluencia {
        id
        nombre
        direccion
      }
      sucursalEntrega {
        id
        nombre
        direccion
      }
      cantidadAsignada
    }
  }
`;

export const deletePedidoItemDistribucionMutation = gql`
  mutation deletePedidoItemDistribucion($id: ID!) {
    data: deletePedidoItemDistribucion(id: $id)
  }
`;

export const savePedidoItemDistribucionesMutation = gql`
  mutation savePedidoItemDistribuciones(
    $pedidoItemId: ID!
    $inputs: [PedidoItemDistribucionInput]!
  ) {
    data: savePedidoItemDistribuciones(
      pedidoItemId: $pedidoItemId
      inputs: $inputs
    ) {
      id
      pedidoItem {
        id
        cantidadSolicitada
        distribucionConcluida
        producto {
          id
          descripcion
        }
      }
      sucursalInfluencia {
        id
        nombre
        direccion
      }
      sucursalEntrega {
        id
        nombre
        direccion
      }
      cantidadAsignada
    }
  }
`;

export const replacePedidoItemDistribucionesMutation = gql`
  mutation replacePedidoItemDistribuciones(
    $pedidoItemId: ID!
    $inputs: [PedidoItemDistribucionInput]!
  ) {
    data: replacePedidoItemDistribuciones(
      pedidoItemId: $pedidoItemId
      inputs: $inputs
    ) {
      id
      pedidoItem {
        id
        cantidadSolicitada
        distribucionConcluida
        producto {
          id
          descripcion
        }
      }
      sucursalInfluencia {
        id
        nombre
        direccion
      }
      sucursalEntrega {
        id
        nombre
        direccion
      }
      cantidadAsignada
    }
  }
`;

export const deletePedidoItemDistribucionesByPedidoItemIdMutation = gql`
  mutation deletePedidoItemDistribucionesByPedidoItemId($pedidoItemId: ID!) {
    data: deletePedidoItemDistribucionesByPedidoItemId(
      pedidoItemId: $pedidoItemId
    )
  }
`;

export const deletePedidoItemDistribucionesByIdsMutation = gql`
  mutation deletePedidoItemDistribucionesByIds($ids: [ID]!) {
    data: deletePedidoItemDistribucionesByIds(ids: $ids)
  }
`;

// ===== NOTA RECEPCION ITEM DISTRIBUCION QUERIES =====

export const notaRecepcionItemDistribucionQuery = gql`
  query ($id: ID!) {
    data: notaRecepcionItemDistribucion(id: $id) {
      id
      notaRecepcionItem {
        id
        cantidadEnNota
        producto {
          id
          descripcion
        }
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidad
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const notaRecepcionItemDistribucionesByNotaRecepcionItemIdQuery = gql`
  query ($notaRecepcionItemId: ID!) {
    data: notaRecepcionItemDistribucionesByNotaRecepcionItemId(
      notaRecepcionItemId: $notaRecepcionItemId
    ) {
      id
      notaRecepcionItem {
        id
        cantidadEnNota
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidad
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const notaRecepcionItemDistribucionesBySucursalEntregaIdQuery = gql`
  query ($sucursalId: ID!) {
    data: notaRecepcionItemDistribucionesBySucursalEntregaId(
      sucursalId: $sucursalId
    ) {
      id
      notaRecepcionItem {
        id
        cantidadEnNota
        producto {
          id
          descripcion
        }
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidad
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const notaRecepcionItemDistribucionesByNotaRecepcionIdQuery = gql`
  query ($notaRecepcionId: ID!) {
    data: notaRecepcionItemDistribucionesByNotaRecepcionId(
      notaRecepcionId: $notaRecepcionId
    ) {
      id
      notaRecepcionItem {
        id
        cantidadEnNota
        producto {
          id
          descripcion
        }
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidad
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const totalDistributedQuantityByNotaRecepcionItemIdQuery = gql`
  query ($notaRecepcionItemId: ID!) {
    data: totalDistributedQuantityByNotaRecepcionItemId(
      notaRecepcionItemId: $notaRecepcionItemId
    )
  }
`;

export const distributedQuantityByNotaRecepcionItemIdAndSucursalIdQuery = gql`
  query ($notaRecepcionItemId: ID!, $sucursalId: ID!) {
    data: distributedQuantityByNotaRecepcionItemIdAndSucursalId(
      notaRecepcionItemId: $notaRecepcionItemId
      sucursalId: $sucursalId
    )
  }
`;

// ===== NOTA RECEPCION ITEM DISTRIBUCION MUTATIONS =====

export const saveNotaRecepcionItemDistribucionMutation = gql`
  mutation saveNotaRecepcionItemDistribucion(
    $input: NotaRecepcionItemDistribucionInput!
  ) {
    data: saveNotaRecepcionItemDistribucion(input: $input) {
      id
      notaRecepcionItem {
        id
        cantidadEnNota
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidad
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const saveNotaRecepcionItemDistribucionesMutation = gql`
  mutation saveNotaRecepcionItemDistribuciones(
    $inputs: [NotaRecepcionItemDistribucionInput]!
  ) {
    data: saveNotaRecepcionItemDistribuciones(inputs: $inputs) {
      id
      notaRecepcionItem {
        id
        cantidadEnNota
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidad
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const replaceNotaRecepcionItemDistribucionesMutation = gql`
  mutation replaceNotaRecepcionItemDistribuciones(
    $notaRecepcionItemId: ID!
    $inputs: [NotaRecepcionItemDistribucionInput]!
  ) {
    data: replaceNotaRecepcionItemDistribuciones(
      notaRecepcionItemId: $notaRecepcionItemId
      inputs: $inputs
    ) {
      id
      notaRecepcionItem {
        id
        cantidadEnNota
      }
      sucursalEntrega {
        id
        nombre
      }
      cantidad
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteNotaRecepcionItemDistribucionMutation = gql`
  mutation deleteNotaRecepcionItemDistribucion($id: ID!) {
    data: deleteNotaRecepcionItemDistribucion(id: $id)
  }
`;

export const deleteNotaRecepcionItemDistribucionesByNotaRecepcionItemIdMutation = gql`
  mutation deleteNotaRecepcionItemDistribucionesByNotaRecepcionItemId(
    $notaRecepcionItemId: ID!
  ) {
    data: deleteNotaRecepcionItemDistribucionesByNotaRecepcionItemId(
      notaRecepcionItemId: $notaRecepcionItemId
    )
  }
`;

export const getPedidoResumenQuery = gql`
  query GetPedidoResumen($pedidoId: ID!) {
    data: getPedidoResumen(pedidoId: $pedidoId) {
      pedidoId
      etapaActual {
        id
        pedido {
          id
        }
        tipoEtapa
        estadoEtapa
        fechaInicio
        fechaFin
        usuarioInicio {
          id
          persona {
            nombre
          }
        }
        creadoEn
      }
      cantidadItems
      valorTotal
      cantidadItemsConDistribucionCompleta
      cantidadItemsPendientesDistribucion
    }
  }
`;

// ===== NOTA RECEPCION QUERIES =====

export const notaRecepcionPorPedidoIdQuery = gql`
  query NotaRecepcionPorPedidoId($pedidoId: ID!) {
    data: notaRecepcionPorPedidoId(id: $pedidoId) {
      id
      numero
      fecha
      estado
      pedido {
        id
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

export const notaRecepcionPorPedidoIdAndNumeroPageQuery = gql`
  query NotaRecepcionPorPedidoIdAndNumeroPage($pedidoId: ID!, $numero: Int, $page: Int!, $size: Int!) {
    data: notaRecepcionPorPedidoIdAndNumero(id: $pedidoId, numero: $numero, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        numero
        fecha
        estado
        pedido {
          id
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
  }
`;

// ===== NOTA RECEPCION CRUD MUTATIONS =====

export const saveNotaRecepcionMutation = gql`
  mutation SaveNotaRecepcion($entity: NotaRecepcionInput!) {
    data: saveNotaRecepcion(entity: $entity) {
      id
      numero
      tipoBoleta
      timbrado
      fecha
      cotizacion
      estado
      pagado
      creadoEn
      pedido {
        id
      }
      moneda {
        id
        denominacion
        simbolo
      }
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteNotaRecepcionMutation = gql`
  mutation DeleteNotaRecepcion($id: ID!) {
    data: deleteNotaRecepcion(id: $id)
  }
`;

// ===== NOTA RECEPCION CRUD QUERIES =====

export const getNotaRecepcionByIdQuery = gql`
  query GetNotaRecepcionById($id: ID!) {
    data: notaRecepcion(id: $id) {
      id
      numero
      tipoBoleta
      timbrado
      fecha
      cotizacion
      estado
      pagado
      creadoEn
      pedido {
        id
      }
      moneda {
        id
        denominacion
        simbolo
      }
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const getNotaRecepcionsQuery = gql`
  query GetNotaRecepcions($page: Int, $size: Int) {
    data: notaRecepcions(page: $page, size: $size) {
      id
      numero
      tipoBoleta
      timbrado
      fecha
      cotizacion
      estado
      pagado
      creadoEn
      pedido {
        id
      }
      moneda {
        id
        denominacion
        simbolo
      }
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const countNotaRecepcionQuery = gql`
  query CountNotaRecepcion {
    data: countNotaRecepcion
  }
`;

export const countNotaRecepcionPorPedidoIdQuery = gql`
  query CountNotaRecepcionPorPedidoId($id: ID!) {
    data: countNotaRecepcionPorPedidoId(id: $id)
  }
`;

// ===== NOTA RECEPCION ITEM QUERIES =====

export const notaRecepcionItemQuery = gql`
  query NotaRecepcionItem($id: ID!) {
    data: notaRecepcionItem(id: $id) {
      id
      notaRecepcion {
        id
        numero
        fecha
        estado
      }
      pedidoItem {
        id
        cantidadSolicitada
        precioUnitarioSolicitado
        producto {
          id
          descripcion
          codigoPrincipal
        }
      }
      producto {
        id
        descripcion
        codigoPrincipal
      }
      presentacionEnNota {
        id
        cantidad
        descripcion
      }
      cantidadEnNota
      precioUnitarioEnNota
      esBonificacion
      vencimientoEnNota
      observacion
      estado
      motivoRechazo
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const notaRecepcionItemListQuery = gql`
  query NotaRecepcionItemList($page: Int!, $size: Int!) {
    data: notaRecepcionItemList(page: $page, size: $size) {
      id
      notaRecepcion {
        id
        numero
        fecha
        estado
      }
      pedidoItem {
        id
        cantidadSolicitada
        precioUnitarioSolicitado
        producto {
          id
          descripcion
          codigoPrincipal
        }
      }
      producto {
        id
        descripcion
        codigoPrincipal
      }
      presentacionEnNota {
        id
        cantidad
        descripcion
      }
      cantidadEnNota
      precioUnitarioEnNota
      esBonificacion
      vencimientoEnNota
      observacion
      estado
      motivoRechazo
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const notaRecepcionItemListPorNotaRecepcionIdQuery = gql`
  query NotaRecepcionItemListPorNotaRecepcionId($id: ID!) {
    data: notaRecepcionItemListPorNotaRecepcionId(id: $id) {
      id
      notaRecepcion {
        id
        numero
        fecha
        estado
      }
      pedidoItem {
        id
        cantidadSolicitada
        precioUnitarioSolicitado
        producto {
          id
          descripcion
          codigoPrincipal
        }
      }
      producto {
        id
        descripcion
        codigoPrincipal
      }
      presentacionEnNota {
        id
        cantidad
        descripcion
      }
      cantidadEnNota
      precioUnitarioEnNota
      esBonificacion
      vencimientoEnNota
      observacion
      estado
      motivoRechazo
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const countNotaRecepcionItemQuery = gql`
  query CountNotaRecepcionItem {
    data: countNotaRecepcionItem
  }
`;

// ===== NOTA RECEPCION ITEM MUTATIONS =====

export const saveNotaRecepcionItemMutation = gql`
  mutation SaveNotaRecepcionItem($NotaRecepcionItem: NotaRecepcionItemInput!) {
    data: saveNotaRecepcionItem(NotaRecepcionItem: $NotaRecepcionItem) {
      id
      notaRecepcion {
        id
        numero
        fecha
        estado
      }
      pedidoItem {
        id
        cantidadSolicitada
        precioUnitarioSolicitado
        producto {
          id
          descripcion
          codigoPrincipal
        }
      }
      producto {
        id
        descripcion
        codigoPrincipal
      }
      presentacionEnNota {
        id
        cantidad
        descripcion
      }
      cantidadEnNota
      precioUnitarioEnNota
      esBonificacion
      vencimientoEnNota
      observacion
      estado
      motivoRechazo
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteNotaRecepcionItemMutation = gql`
  mutation DeleteNotaRecepcionItem($id: ID!) {
    data: deleteNotaRecepcionItem(id: $id)
  }
`;

export const adicionarItensMutation = gql`
  mutation AdicionarItens($id: ID, $notaRecepcionItemInputList: [NotaRecepcionItemInput]) {
    data: adicionarItens(id: $id, notaRecepcionItemInputList: $notaRecepcionItemInputList) {
      id
      notaRecepcion {
        id
        numero
        fecha
        estado
      }
      pedidoItem {
        id
        cantidadSolicitada
        precioUnitarioSolicitado
        producto {
          id
          descripcion
          codigoPrincipal
        }
      }
      producto {
        id
        descripcion
        codigoPrincipal
      }
      presentacionEnNota {
        id
        cantidad
        descripcion
      }
      cantidadEnNota
      precioUnitarioEnNota
      esBonificacion
      vencimientoEnNota
      observacion
      estado
      motivoRechazo
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const removerItensMutation = gql`
  mutation RemoverItens($id: ID, $notaRecepcionItemInputList: [NotaRecepcionItemInput]) {
    data: removerItens(id: $id, notaRecepcionItemInputList: $notaRecepcionItemInputList)
  }
`;
