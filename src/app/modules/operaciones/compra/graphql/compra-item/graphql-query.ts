import gql from 'graphql-tag';

export const compraItensQuery = gql
  `{
    compraItens {
      id
      cantidad
      precioUnitario
      descuentoUnitario
      valorTotal
      bonificacion
      observacion
      lote
      estado
      compra{
        id
        valorTotal
      }
      producto{
        id
        descripcion
      }
    }
  }`

export const compraItemPorProductoId = gql
  `query($id: ID!){
    data : compraItemPorProductoId(id: $id){
      id
      cantidad
      precioUnitario
      descuentoUnitario
      valorTotal
      bonificacion
      observacion
      lote
      estado
      compra{
        id
        valorTotal
      }
      producto{
        id
        descripcion
      }
    }
  }`

export const compraItemQuery = gql
  `query($id: ID!){
    data : compraItem(id: $id){
      id
      cantidad
      precioUnitario
      descuentoUnitario
      valorTotal
      bonificacion
      observacion
      lote
      estado
      compra{
        id
        valorTotal
      }
      producto{
        id
        descripcion
      }
    }
  }`

export const saveCompra = gql
  `mutation saveCompra($entity:CompraInput!){
      data: saveCompra(compraItem:$entity){
        id
      }
    }`

export const deleteCompraQuery = gql
  ` mutation deleteCompra($id: ID!){
      deleteCompra(id: $id)
  }`


