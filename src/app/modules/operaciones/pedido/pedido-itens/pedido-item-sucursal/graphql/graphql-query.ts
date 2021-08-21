import gql from 'graphql-tag';

export const pedidoItensSucursalesQuery = gql
  `{
    id
    PedidoItem{
      id
    }
    sucursal{
      id
    }
    sucursalEntrega{
      id
    }
    cantidad
    creadoEn
    usuario{
      id
    }
  }`

export const pedidoItensSucursalesSearch = gql
  `query($texto: String){
    data : pedidoItemSucursalSearch(texto: $texto){
      id
    PedidoItem{
      id
    }
    sucursal{
      id
    }
    sucursalEntrega{
      id
    }
    cantidad
    creadoEn
    usuario{
      id
    }
    }
  }`

export const pedidoItemSucursalQuery = gql
  `query($id: ID!){
    data : pedidoItemSucursal(id: $id){
      id
    PedidoItem{
      id
    }
    sucursal{
      id
    }
    sucursalEntrega{
      id
    }
    cantidad
    creadoEn
    usuario{
      id
    }
    }
  }`

export const savePedidoItemSucursal = gql
  `mutation savePedidoItemSucursal($entity:PedidoItemSucursalInput!){
      data: savePedidoItemSucursal(pedidoItemSucursal:$entity){
        id
      }
    }`

export const deletePedidoItemSucursalQuery = gql
  ` mutation deletePedidoItemSucursal($id: ID!){
      deletePedidoItemSucursal(id: $id){
        id
      }
  }`


