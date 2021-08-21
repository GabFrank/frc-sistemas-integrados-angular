import gql from 'graphql-tag';

export const pedidosQuery = gql
  `{
    pedido {
      id
      proveedor{
        persona{
          nombre
        }
      }
      nombreProveedor
      formaPago
      estado
      moneda{
        denominacion
      }
      diasCheque
      creadoEn
      usuario{
        persona{
          nombre
        }
      }
      nombreUsuario
      descuento
      valorTotal
    }
  }`

export const pedidosSearch = gql
  `query($texto: String){
    data : pedidoSearch(texto: $texto){
      id
      proveedor{
        persona{
          nombre
        }
      }
      nombreProveedor
      formaPago
      estado
      moneda{
        denominacion
      }
      diasCheque
      creadoEn
      usuario{
        persona{
          nombre
        }
      }
      nombreUsuario
      descuento
      valorTotal
    }
  }`

export const pedidoQuery = gql
  `query($id: ID!){
    data : pedido(id: $id){
      id
      proveedor{
        persona{
          nombre
        }
      }
      nombreProveedor
      formaPago
      estado
      moneda{
        denominacion
      }
      diasCheque
      creadoEn
      usuario{
        persona{
          nombre
        }
      }
      nombreUsuario
      descuento
      valorTotal
    }
  }`

export const savePedido = gql
  `mutation savePedido($entity:PedidoInput!){
      data: savePedido(pedido:$entity){
        id
      }
    }`

export const deletePedidoQuery = gql
  ` mutation deletePedido($id: ID!){
      deletePedido(id: $id)
  }`

  export const filterPedidosQuery = gql
  ` query filterPedidos($estado: PedidoEstado, $sucursalId: Int, $inicio: String, $fin: String, $proveedorId: Int, $vendedorId: Int, $formaPago: FormaPago, $productoId: Int){
    data : filterPedidos(estado: $estado, sucursalId: $sucursalId, inicio:$inicio, fin:$fin, proveedorId:$proveedorId, vendedorId:$vendedorId, formaPago:$formaPago, productoId:$productoId){
      id
      proveedor{
        id
        persona{
          nombre
        }
      }
      vendedor{
        id
        persona{
          nombre
        }
      }
      nombreProveedor
      formaPago
      estado
      moneda{
        id
        denominacion
        simbolo
      }
      diasCheque
      creadoEn
      usuario{
        id
        persona{
          nombre
        }
      }
      nombreUsuario
      descuento 
      valorTotal 
      pedidoItens{
        id
        producto{
          id
          descripcion
        }
        precioUnitario
        descuentoUnitario
        bonificacion
        bonificacionDetalle
        estado
        vencimiento
        creadoEn
        pedidoItemSucursales{
          id
          sucursal{
            id
            nombre
          }
          sucursalEntrega{
            id
            nombre
          }
          cantidad
        }
      }  
    }
  }`

  export const pedidoInfoCompletaQuery = gql
  `query($id: ID!){
    data : pedido(id: $id){
      id
      proveedor{
        persona{
          nombre
        }
      }
      formaPago
      estado
      moneda{
        denominacion
      }
      diasCheque
      creadoEn
      usuario{
        persona{
          nombre
        }
      }
      descuento
      valorTotal
      pedidoItens{
        id
        producto{
          id
          descripcion
        }
        precioUnitario
        descuentoUnitario
        bonificacion
        bonificacionDetalle
        estado
        vencimiento
        creadoEn
        pedidoItemSucursales{
          id
          sucursal{
            id
            nombre
          }
          sucursalEntrega{
            id
            nombre
          }
          cantidad
        }
      }
    }
  }`


