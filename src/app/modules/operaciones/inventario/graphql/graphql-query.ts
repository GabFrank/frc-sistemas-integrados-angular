import gql from "graphql-tag";

export const inventariosQuery = gql`
  {
    data: inventarios {
      id
      idOrigen
      idCentral
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

export const inventarioQuery = gql`
  query ($id: ID!) {
    data: inventario(id: $id) {
      id
      idOrigen
      idCentral
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

export const saveInventario = gql`
  mutation saveInventario($entity: InventarioInput!) {
    data: saveInventario(inventario: $entity) {
      id
      idOrigen
      idCentral
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

export const deleteInventarioQuery = gql`
  mutation deleteInventario($id: ID!) {
    deleteInventario(id: $id)
  }
`;

export const inventarioPorFechaQuery = gql`
  query ($inicio: String, $fin: String) {
    data: inventarioPorFecha(inicio: $inicio, fin: $fin) {
      id
      idOrigen
      idCentral
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
        }
        cantidad
        vencimiento
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
      idOrigen
      idCentral
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
