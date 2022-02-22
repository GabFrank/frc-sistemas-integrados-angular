import gql from "graphql-tag";

export const productosQuery = gql`
  {
    data: productos {
      id
      descripcion
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
  query ($texto: String, $offset: Int, $isEnvase: Boolean) {
    data: productoSearch(texto: $texto, offset: $offset, isEnvase: $isEnvase) {
      id
      descripcion
      garantia
      vencimiento
      diasVencimiento
      observacion
      codigoPrincipal
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
      descripcion
      garantia
      vencimiento
      diasVencimiento
      observacion
      cambiable
      imagenPrincipal
      isEnvase
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
      vencimiento
      diasVencimiento
      observacion
      cambiable
      imagenPrincipal
      iva
      stock
      isEnvase
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