import gql from "graphql-tag";

export const productosQuery = gql`
  {
    data: productos {
      id
      descripcion
      descripcionFactura
      iva
      unidadPorCaja
      balanza
      cambiable
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
      }
    }
  }
`;

export const productoInfoCompletaQuery = gql`
  query ($id: ID!) {
    data: producto(id: $id) {
      id
      descripcion
      descripcionFactura
      iva
      unidadPorCaja
      balanza
      cambiable
      garantia
      ingrediente
      combo
      stock
      promocion
      vencimiento
      diasVencimiento
      
      tipoConservacion
      codigos {
        id
        codigo
        cantidad
        principal
        caja
        referenciaCodigo {
          id
          codigo
        }
      }
      subfamilia {
        id
        descripcion
        nombre
        familia {
          id
          descripcion
          nombre
        }
        subfamilias {
          id
          nombre
        }
      }
      existenciaTotal
      sucursales {
        moneda {
          id
          denominacion
          simbolo
        }
        fechaUltimaCompra
        sucursal {
          nombre
          deposito
          depositoPredeterminado
        }
        existencia
        precioUltimaCompra
        cantidadUltimaCompra
        costoMedio
        pedido {
          id
          proveedor {
            persona {
              nombre
            }
          }
        }
        cantMinima
        cantMaxima
        cantMedia
      }
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

export const productosExistenciaCostoQuery = gql`
  {
    data: productos {
      id
      descripcion
      descripcionFactura
      iva
      unidadPorCaja
      balanza
      cambiable
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
      }
      existenciaTotal
      sucursales {
        moneda {
          id
          denominacion
          simbolo
        }
        fechaUltimaCompra
        sucursal {
          nombre
          deposito
          depositoPredeterminado
        }
        existencia
        precioUltimaCompra
        cantidadUltimaCompra
        costoMedio
        pedido {
          proveedor {
            persona {
              nombre
            }
          }
        }
      }
      productoUltimasCompras {
        cantidad
        precioUltimaCompra: precio
        creadoEn
        pedido {
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

export const productosExistenciaCostoSearch = gql`
  query ($texto: String) {
    data: productoSearch(texto: $texto) {
      id
      descripcion
      descripcionFactura
      iva
      unidadPorCaja
      balanza
      garantia
      cambiable
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
      existenciaTotal
      sucursales {
        fechaUltimaCompra
        sucursal {
          nombre
          deposito
          depositoPredeterminado
        }
        moneda {
          id
          denominacion
          simbolo
        }
        existencia
        precioUltimaCompra
        cantidadUltimaCompra
        costoMedio
        pedido {
          proveedor {
            persona {
              nombre
            }
          }
        }
      }
      productoUltimasCompras {
        cantidad
        precio
        creadoEn
        pedido {
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

export const productoSearchPdv = gql`
  query ($texto: String) {
    data: productoSearch(texto: $texto) {
      id
      descripcion
      garantia
      vencimiento
      diasVencimiento
      observacion
      cambiable
      presentaciones {
        id
        principal
        codigos {
          id
          codigo
          principal
          activo
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

      }
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
export const productoStockCostoPorSucursal = gql`
  query ($proId: ID!, $sucId: ID!) {
    data: costosPorSucursalLastPorProductoId(proId: $proId, sucId: $sucId) {
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
      descripcionFactura
      iva
      unidadPorCaja
      balanza
      garantia
      ingrediente
      combo
      stock
      promocion
      vencimiento
      diasVencimiento
      cambiable
      
      tipoConservacion
      codigos {
        id
        codigo
        cantidad
        principal
        caja
        referenciaCodigo {
          id
          codigo
        }
      }
      subfamilia {
        id
        descripcion
        familia {
          id
          descripcion
        }
      }
      existenciaTotal
      sucursales {
        moneda {
          id
          denominacion
          simbolo
        }
        fechaUltimaCompra
        sucursal {
          nombre
          deposito
          depositoPredeterminado
        }
        existencia
        precioUltimaCompra
        cantidadUltimaCompra
        costoMedio
        pedido {
          id
          proveedor {
            persona {
              nombre
            }
          }
        }
        cantMinima
        cantMaxima
        cantMedia
      }
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

export const productoPorCodigoQuery = gql`
  query ($texto: String) {
    data: productoPorCodigo(texto: $texto) {
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
      codigos {
        id
        codigo
        cantidad
        principal
        caja
        tipoPrecio {
          id
          descripcion
        }
        preciosPorSucursal {
          sucursal {
            id
          }
          precio
        }
        referenciaCodigo {
          id
          codigo
        }
      }
      subfamilia {
        id
        descripcion
        familia {
          id
          descripcion
        }
      }
      existenciaTotal
      sucursales {
        moneda {
          id
          denominacion
          simbolo
        }
        fechaUltimaCompra
        sucursal {
          nombre
          deposito
          depositoPredeterminado
        }
        existencia
        precioUltimaCompra
        cantidadUltimaCompra
        costoMedio
        pedido {
          id
          proveedor {
            persona {
              nombre
            }
          }
        }
        cantMinima
        cantMaxima
        cantMedia
      }
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
      garantia
      vencimiento
      diasVencimiento
      observacion
      cambiable
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
