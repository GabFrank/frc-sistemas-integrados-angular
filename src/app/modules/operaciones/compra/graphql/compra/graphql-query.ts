import gql from 'graphql-tag';

export const comprasQuery = gql
  `{
    compras {
      id
      proveedor{
        id
        persona{
          nombre
        }
      }
      pedido{
        id
      }
      estado
      valorTotal
      compraItens{
        id
      }
    }
  }`

export const comprasSearch = gql
  `query($texto: String){
    data : compraSearch(texto: $texto){
      id
      proveedor{
        id
        persona{
          nombre
        }
      }
      pedido{
        id
      }
      estado
      valorTotal
      compraItens{
        id
        producto{
          descripcion
        }
        cantidad
        precioUnitario
        descuentoUnitario
        valorTotal
        bonificacion
      }
    }
  }`

export const compraQuery = gql
  `query($id: ID!){
    data : compra(id: $id){
      id
      proveedor{
        id
        persona{
          nombre
        }
      }
      pedido{
        id
      }
      estado
      tipoPago
      nroNota
      tipoPago
      valorTotal
      compraItens{
        id
        producto{
          descripcion
        }
        cantidad
        precioUnitario
        descuentoUnitario
        valorTotal
        bonificacion
      }
    }
  }`

export const saveCompra = gql
  `mutation saveCompra($entity:CompraInput!){
      data: saveCompra(compra:$entity){
        id
      }
    }`

export const deleteCompraQuery = gql
  ` mutation deleteCompra($id: ID!){
      deleteCompra(id: $id)
  }`

  export const comprasPorProductoQuery = gql
  `query($id: ID!){
    data : comprasPorProducto(id: $id){
      id
      proveedor{
        id
        persona{
          nombre
        }
      }
      pedido{
        id
      }
      estado
      tipoPago
      nroNota
      tipoPago
      valorTotal
      compraItens{
        id
        producto{
          descripcion
        }
        cantidad
        precioUnitario
        descuentoUnitario
        valorTotal
        bonificacion
      }
    }
  }`



