import gql from 'graphql-tag';

export const ventaCreditosQuery = gql
  `{
    ventaCreditos{
      id
      sucursal {
        id
        nombre
      }
      venta {
        id
      }
      cliente {
        id
      }
      tipoConfirmacion
      cantidadCuotas
      valorTotal
      saldoTotal
      plazoEnDias
      interesPorDia
      interesMoraDia
      estado
      creadoEn
      usuario { 
        id
      }
    }
  }`


export const ventaCreditoQuery = gql
  `query($id: ID!){
    data: ventaCredito(id: $id){
      id
      sucursal {
        id
        nombre
      }
      venta {
        id
      }
      cliente {
        id
      }
      tipoConfirmacion
      cantidadCuotas
      valorTotal
      saldoTotal
      plazoEnDias
      interesPorDia
      interesMoraDia
      estado
      creadoEn
      usuario { 
        id
      }
    }
  }`

export const saveVentaCredito = gql
  `mutation saveVentaCredito($entity:VentaCreditoInput!, $detalleList:[VentaCreditoCuotaInput]!){
      data: saveVentaCredito(entity:$entity, detalleList:$detalleList){
        id
      }
    }`

export const deleteVentaCreditoQuery = gql
  ` mutation deleteVentaCredito($id: ID!){
    deleteVentaCredito(id: $id)
}`

export const ventaCreditoAuthSubQuery = gql
  ` subscription ventaCreditoAuthQrSub {
    data: ventaCreditoAuthQrSub {
      clienteId
      timestamp
    }
  }`


