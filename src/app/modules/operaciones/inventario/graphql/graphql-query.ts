import gql from "graphql-tag";

export const inventariosQuery = gql`
  {
    data: inventarios {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

export const inventarioQuery = gql`
  query ($id: ID!) {
    data: inventario(id: $id) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
            producto {
              id
              descripcion
              codigoPrincipal
            }
          }
          cantidad
          cantidadFisica
          vencimiento
          estado
          creadoEn
        }
      }
    }
  }
`;

export const inventarioPorUsuarioQuery = gql`
  query ($id: ID!) {
    data: inventarioPorUsuario(id: $id) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

export const saveInventario = gql`
  mutation saveInventario($entity: InventarioInput!) {
    data: saveInventario(inventario: $entity) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

export const deleteInventarioQuery = gql`
  mutation deleteInventario($id: ID!) {
    deleteInventario(id: $id)
  }
`;

export const inventarioPorFechaQuery = gql`
  query ($inicio: String, $fin: String) {
    data: inventarioPorFecha(inicio: $inicio, fin: $fin) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        producto {
          id
          descripcion
        }
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

export const saveInventarioProducto = gql`
  mutation saveInventarioProducto($entity: InventarioProductoInput!) {
    data: saveInventarioProducto(inventarioProducto: $entity) {
      id
      concluido
      inventario {
        id
      }
      zona {
        id
        sector {
          id
          descripcion
        }
        descripcion
      }
      usuario {
        id
        persona {
          nombre
        }
      }
      inventarioProductoItemList {
        id
        presentacion {
          id
          cantidad
          imagenPrincipal
          producto {
            id
            descripcion
            codigoPrincipal
          }
        }
        cantidad
        cantidadFisica
        vencimiento
        estado
        creadoEn
      }
    }
  }
`;

export const deleteInventarioProductoQuery = gql`
  mutation deleteInventarioProducto($id: ID!) {
    deleteInventarioProducto(id: $id)
  }
`;

export const saveInventarioProductoItem = gql`
  mutation saveInventarioProductoItem($entity: InventarioProductoItemInput!) {
    data: saveInventarioProductoItem(inventarioProductoItem: $entity) {
      id
      zona {
        id
        sector {
          id
          descripcion
        }
        descripcion
      }
      presentacion {
        id
        cantidad
        imagenPrincipal
      }
      cantidad
      vencimiento
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

export const deleteInventarioProductoItemQuery = gql`
  mutation deleteInventarioProductoItem($id: ID!) {
    deleteInventarioProductoItem(id: $id)
  }
`;

export const inverntarioAbiertoPorSucursalQuery = gql`
  query ($id: ID!) {
    data: inventarioAbiertoPorSucursal(sucId: $id) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
      inventarioProductoList {
        id
        concluido
        zona {
          id
          sector {
            id
            descripcion
          }
          descripcion
        }
        inventarioProductoItemList {
          id
          presentacion {
            id
            cantidad
            imagenPrincipal
          }
          cantidad
          vencimiento
          creadoEn
        }
      }
    }
  }
`;

export const inventarioProductoItemWithFilterQuery = gql`
  query (
    $startDate: String
    $endDate: String
    $sucursalIdList: [Int]
    $usuarioIdList: [ID]
    $productoIdList: [ID]
    $page: Int
    $size: Int
    $orderBy: String
    $tipoOrder: String
  ) {
    data: inventarioProductoItemWithFilter(
      startDate: $startDate
      endDate: $endDate
      sucursalIdList: $sucursalIdList
      usuarioIdList: $usuarioIdList
      productoIdList: $productoIdList
      page: $page
      size: $size
      orderBy: $orderBy
      tipoOrder: $tipoOrder
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getPageable {
        getPageNumber
        getPageSize
      }
      getContent {
        id
        inventarioProducto {
          id
          inventario {
            id
            sucursal {
              id
              nombre
            }
          }
        }
        zona {
          id
        }
        presentacion {
          id
          cantidad
          producto {
            id
            descripcion
            codigoPrincipal
          }
        }
        cantidad
        cantidadFisica
        vencimiento
        estado
        creadoEn
        usuario {
          id
          nickname
        }
      }
    }
  }
`;

export const reporteInventarioQuery = gql`
  query (
    $startDate: String
    $endDate: String
    $sucursalIdList: [Int]
    $usuarioIdList: [ID]
    $productoIdList: [ID]
    $page: Int
    $size: Int
    $orderBy: String
    $tipoOrder: String
    $nickname: String
  ) {
    data: reporteInventario(
      startDate: $startDate
      endDate: $endDate
      sucursalIdList: $sucursalIdList
      usuarioIdList: $usuarioIdList
      productoIdList: $productoIdList
      page: $page
      size: $size
      orderBy: $orderBy
      tipoOrder: $tipoOrder
      nickname: $nickname
    )
  }
`;

export const inventarioProductoItemQuery = gql`
  query ($id: ID!) {
    data: inventarioProductoItem(id: $id) {
      id
      inventarioProducto {
        id
      }
      zona {
        id
      }
      presentacion {
        id
        cantidad
        producto {
          id
          descripcion
          codigoPrincipal
        }
      }
      cantidad
      cantidadFisica
      vencimiento
      estado
      creadoEn
      usuario {
        id
        nickname
      }
    }
  }
`;
export const productosVencidosQuery = gql`
  query ProductosVencidos(
    $startDate: String
    $endDate: String
    $sucursalIdList: [Int]
    $usuarioIdList: [ID]
    $productoIdList: [ID]
    $soloRealmenteVencidos: Boolean
    $page: Int
    $size: Int
  ) {
    productosVencidos(
      startDate: $startDate
      endDate: $endDate
      sucursalIdList: $sucursalIdList
      usuarioIdList: $usuarioIdList
      productoIdList: $productoIdList
      soloRealmenteVencidos: $soloRealmenteVencidos
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
      getPageable {
        getPageNumber
        getPageSize
      }
      getContent {
        id
        inventarioProducto {
          id
          inventario {
            id
            sucursal {
              id
              nombre
            }
          }
        }
        zona {
          id
          descripcion
        }
        sector {
          id
          descripcion
        }
        presentacion {
          id
          cantidad
          producto {
            id
            descripcion
            codigoPrincipal
          }
        }
        cantidad
        cantidadFisica
        vencimiento
        estado
        creadoEn
        usuario {
          id
          nickname
        }
      }
    }
  }
`;

export const inventarioProductoQuery = gql`
  query ($id: ID!) {
    data: inventarioProducto(id: $id) {
      id
      inventario {
        id
        sucursal {
          id
          nombre
        }
        tipo
        estado
      }
      zona {
        id
        sector {
          id
          descripcion
        }
        descripcion
      }
      concluido
      usuario {
        id
        persona {
          nombre
        }
      }
      inventarioProductoItemList {
        id
        presentacion {
          id
          cantidad
          imagenPrincipal
          producto {
            id
            descripcion
            codigoPrincipal
          }
        }
        cantidad
        cantidadFisica
        vencimiento
        estado
        creadoEn
      }
    }
  }
`;

export const inventarioProductosItemPorInventarioProductoQuery = gql`
  query ($id: ID!, $page: Int, $size: Int) {
    data: inventarioProductosItemPorInventarioProducto(id: $id, page: $page, size: $size) {
      id
      inventarioProducto {
        id
      }
      zona {
        id
        sector {
          id
          descripcion
        }
        descripcion
      }
      presentacion {
        id
        cantidad
        imagenPrincipal
        producto {
          id
          descripcion
          codigoPrincipal
        }
      }
      cantidad
      cantidadFisica
      vencimiento
      estado
      creadoEn
      usuario {
        id
        nickname
      }
    }
  }
`;

export const finalizarInventarioQuery = gql`
  mutation ($id: ID!) {
    data: finalizarInventario(id: $id) {
      id
      sucursal {
        id
        nombre
      }
      fechaInicio
      fechaFin
      abierto
      tipo
      estado
      usuario {
        persona {
          nombre
        }
      }
      observacion
    }
  }
`;

export const cancelarInventarioQuery = gql`
  mutation ($id: ID!) {
    cancelarInventario(id: $id)
  }
`;

export const reabrirInventarioQuery = gql`
  mutation ($id: ID!) {
    reabrirInventario(id: $id)
  }
`;
