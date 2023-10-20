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
      presentacion {
        cantidad
        imagenPrincipal
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
      creadoEn
      compra{
        id
        estado
        proveedor{
          persona{
            nombre
          }
        }
      }
      producto{
        id
        descripcion
      }
      presentacion {
        cantidad
        imagenPrincipal
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
      bonificacion
      observacion
      vencimiento
      lote
      estado
      compra {
        id
      }
      pedidoItem {
        id
      }
      producto{
        id
        descripcion
      }
      presentacion {
        cantidad
        imagenPrincipal
      }
    }
  }`

  export const saveCompraItem = gql
  `mutation saveCompraItem($entity:CompraItemInput!){
      data: saveCompraItem(compraItem:$entity){
        id
        cantidad
        verificado
      }
    }`

export const deleteCompraItemQuery = gql
  ` mutation deleteCompraItem($id: ID!){
      deleteCompraItem(id: $id)
  }`


