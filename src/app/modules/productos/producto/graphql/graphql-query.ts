import gql from "graphql-tag";

export const productosQuery = gql`
  {
    data: productos {
      id
      descripcion
      descripcionFactura
      garantia
      vencimiento
      diasVencimiento
      observacion
      cambiable
      imagenPrincipal
      subfamilia {
        id
        descripcion
        familia {
          id
          descripcion
        }
      }
      costo {
        ultimoPrecioCompra
      }
      presentaciones {
        id
        principal
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
        cantidad
        imagenPrincipal
        precios {
          id
          precio
          tipoPrecio {
            id
            descripcion
          }
          principal
          activo
        }
      }
    }
  }
`;

export const productosExistenciaCostoQuery = gql`
  {
    data: productos {
      id
      descripcion
    }
  }
`;

export const productosExistenciaCostoSearch = gql`
  query ($texto: String) {
    data: productoSearch(texto: $texto) {
      id
    }
  }
`;

export const productoSearchPdv = gql`
  query ($texto: String, $offset: Int, $isEnvase: Boolean, $activo: Boolean) {
    data: productoSearch(
      texto: $texto
      offset: $offset
      isEnvase: $isEnvase
      activo: $activo
    ) {
      id
      balanza
      descripcion
      descripcionFactura
      garantia
      vencimiento
      diasVencimiento
      observacion
      codigoPrincipal
      precioPrincipal
      costo {
        ultimoPrecioCompra
      }
      envase {
        id
        descripcion
      }
      # cambiable
      # presentaciones {
      #   id
      #   principal
      #   codigos {
      #     id
      #     codigo
      #     principal
      #     activo
      #   }
      #   tipoPresentacion {
      #     id
      #     descripcion
      #   }
      #   cantidad
      #   imagenPrincipal
      #   precios {
      #     id
      #     precio
      #     tipoPrecio {
      #       id
      #       descripcion
      #     }
      #     principal
      #     activo
      #   }
      # }
    }
  }
`;

export const envaseSearchPdv = gql`
  query ($texto: String, $offset: Int, $isEnvase: Boolean) {
    data: productoSearch(texto: $texto, offset: $offset, isEnvase: $isEnvase) {
      id
      descripcion
      precioPrincipal
    }
  }
`;

export const productosSearch = gql`
  query ($texto: String) {
    data: productoSearch(texto: $texto) {
      id
      descripcion
      descripcionFactura
      iva
      unidadPorCaja
      balanza
      garantia
      ingrediente
      combo
      cambiable
      stock
      promocion
      vencimiento
      diasVencimiento
      costo {
        ultimoPrecioCompra
      }
      tipoConservacion
      subfamilia {
        id
        descripcion
        familia {
          id
          descripcion
        }
      }
    }
  }
`;

export const searchProductoWithFilters = gql`
  query (
    $texto: String
    $codigo: String
    $activo: Boolean
    $stock: Boolean
    $balanza: Boolean
    $subfamilia: Int
    $vencimiento: Boolean
    $page: Int
    $size: Int
  ) {
    data: searchProductoWithFilters(
      texto: $texto
      codigo: $codigo
      activo: $activo
      stock: $stock
      balanza: $balanza
      subfamilia: $subfamilia
      vencimiento: $vencimiento
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
        descripcion
        costo {
          costoMedio
          ultimoPrecioCompra
        }
        precioPrincipal
        codigoPrincipal
      }
    }
  }
`;

export const productoStock = gql`
  query ($proId: ID!, $sucId: ID!) {
    data: productoPorSucursalStock(proId: $proId, sucId: $sucId)
  }
`;
export const productoStockCostoPorProducto = gql`
  query ($proId: ID!, $sucId: ID!) {
    data: costoPorProductolLastPorProductoId(proId: $proId) {
      sucursal {
        id
        nombre
      }
      producto {
        id
        descripcion
      }
      ultimoPrecioCompra
      ultimoPrecioVenta
      costoMedio
      cantMinima
      cantMaxima
      cantMedia
      movimientoStock {
        id
        cantidad
        proveedor {
          id
          persona {
            id
            nombre
          }
        }
      }
    }
  }
`;

export const productoExistenciaCostoPorProveedor = gql`
  query ($id: ID!, $texto: String) {
    data: productoPorProveedorId(id: $id, texto: $texto) {
      id
      descripcion
    }
  }
`;

export const productoPorCodigoQuery = gql`
  query ($texto: String) {
    data: productoPorCodigo(texto: $texto) {
      id
      balanza
      descripcion
      descripcionFactura
      garantia
      vencimiento
      diasVencimiento
      observacion
      cambiable
      imagenPrincipal
      isEnvase
      costo {
        ultimoPrecioCompra
        costoMedio
      }
      envase {
        id
        descripcion
      }
      subfamilia {
        id
        descripcion
        familia {
          id
          descripcion
        }
      }
      presentaciones {
        id
        principal
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
        cantidad
        imagenPrincipal
        precios {
          id
          precio
          tipoPrecio {
            id
            descripcion
          }
          principal
          activo
        }
      }
      codigoPrincipal
    }
  }
`;

export const productoPorProveedor = gql`
  query ($id: ID!, $texto: String) {
    data: productoPorProveedorId(id: $id, texto: $texto) {
      id
      descripcion
      descripcionFactura
      iva
      cambiable
      unidadPorCaja
      balanza
      garantia
      ingrediente
      combo
      stock
      promocion
      vencimiento
      diasVencimiento
      costo {
        ultimoPrecioCompra
      }
      tipoConservacion
      subfamilia {
        id
        descripcion
        familia {
          id
          descripcion
        }
      }
    }
  }
`;

export const productoQuery = gql`
  query ($id: ID!) {
    data: producto(id: $id) {
      id
      descripcion
      descripcionFactura
      garantia
      balanza
      vencimiento
      diasVencimiento
      observacion
      cambiable
      imagenPrincipal
      iva
      stock
      isEnvase
      codigoPrincipal
      precioPrincipal
      activo
      creadoEn
      envase {
        id
        descripcion
      }
      subfamilia {
        id
        nombre
        descripcion
        activo
        creadoEn
        usuario {
          id
        }
        familia {
          id
          nombre
          descripcion
          activo
          creadoEn
          usuario {
            id
          }
        }
      }
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
        imagenPrincipal
        precios {
          id
          precio
          tipoPrecio {
            id
            descripcion
          }
          principal
          activo
        }
        codigoPrincipal {
          codigo
        }
      }
      costo {
        id
        ultimoPrecioCompra
        costoMedio
      }
    }
  }
`;

export const productoUltimasComprasQuery = gql`
  query ($id: ID!) {
    data: producto(id: $id) {
      id
      descripcion
      productoUltimasCompras {
        cantidad
        precio
        creadoEn
        pedido {
          id
          proveedor {
            persona {
              nombre
            }
          }
        }
      }
    }
  }
`;

export const saveProducto = gql`
  mutation saveProducto($entity: ProductoInput!) {
    data: saveProducto(producto: $entity) {
      id
      descripcion
      descripcionFactura
      iva
      unidadPorCaja
      unidadPorCajaSecundaria
      balanza
      garantia
      ingrediente
      combo
      cambiable
      stock
      promocion
      vencimiento
      diasVencimiento
      costo {
        ultimoPrecioCompra
      }
      tipoConservacion
      subfamilia {
        id
        descripcion
        nombre
        familia {
          id
          descripcion
          nombre
        }
        subfamiliaList {
          id
          nombre
          descripcion
        }
      }
    }
  }
`;

export const deleteProductoQuery = gql`
  mutation deleteProducto($id: ID!) {
    deleteProducto(id: $id)
  }
`;

export const saveImagenProductoQuery = gql`
  mutation saveImagenProducto($image: String!, $filename: String!) {
    saveImagenProducto(image: $image, filename: $filename)
  }
`;

export const printProductoPorId = gql`
  query ($id: ID!) {
    data: printProducto(id: $id) {
      id
    }
  }
`;

export const productoParaPedidoQuery = gql`
  query ($id: ID!) {
    data: producto(id: $id) {
      id
      descripcion
      descripcionFactura
      garantia
      vencimiento
      diasVencimiento
      observacion
      cambiable
      imagenPrincipal
      iva
      stock
      presentaciones {
        id
        descripcion
        principal
        cantidad
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
        imagenPrincipal
        precios {
          id
          precio
          tipoPrecio {
            id
            descripcion
          }
          principal
          activo
        }
        codigoPrincipal {
          codigo
        }
      }
      costo {
        id
        movimientoStock {
          id
        }
        ultimoPrecioCompra
        ultimoPrecioVenta
        costoMedio
        moneda {
          id
          denominacion
          cambio
        }
        existencia
      }
    }
  }
`;

export const exportarReporteQuery = gql`
  query ($texto: String) {
    data: exportarReporte(texto: $texto)
  }
`;

export const findByPdvGrupoProductoQuery = gql`
  query ($id: ID!) {
    data: findByPdvGrupoProductoId(id: $id) {
      id
      descripcion
      descripcionFactura
      garantia
      vencimiento
      diasVencimiento
      observacion
      cambiable
      imagenPrincipal
      iva
      stock
      isEnvase
      costo {
        ultimoPrecioCompra
      }
      envase {
        id
        descripcion
        precioPrincipal
      }
      presentaciones {
        id
        descripcion
        principal
        cantidad
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
        imagenPrincipal
        precios {
          id
          precio
          tipoPrecio {
            id
            descripcion
          }
          principal
          activo
        }
        codigoPrincipal {
          codigo
        }
      }
    }
  }
`;

export const lucroPorProductoQuery = gql`
  query lucroPorProducto(
    $fechaInicio: String
    $fechaFin: String
    $sucursalIdList: [Int]
    $usuarioId: ID!
    $usuarioIdList: [ID]
    $productoIdList: [ID]
  ) {
    data: lucroPorProducto(
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucursalIdList: $sucursalIdList
      usuarioId: $usuarioId
      usuarioIdList: $usuarioIdList
      productoIdList: $productoIdList
    )
  }
`;

export const imprimirCodigoBarraQuery = gql`
  query imprimirCodigoBarra($codigoId: Int) {
    data: imprimirCodigoBarra(codigoId: $codigoId)
  }
`;
