import gql from 'graphql-tag';

export const sucursalesQuery = gql
  `{
    data: sucursales {
      id
      nombre
      localizacion
      ciudad{
        id
      }
      creadoEn
      usuario{
        id
      }
      deposito
      ip
      puerto
      direccion
      nroDelivery
      depositoPredeterminado
      deposito
      codigoEstablecimientoFactura
      isConfigured
    }
  }`;

export const sucursalesSearch = gql
  `query($texto: String){
    data : sucursalesSearch(texto: $texto){
      id
      nombre
      localizacion
      ciudad{
        id
        descripcion
      }
      creadoEn
      usuario{
        id
        nickname
      }
      ip
      puerto
      direccion
      nroDelivery
      depositoPredeterminado
      deposito
      codigoEstablecimientoFactura
      isConfigured
      activo
    }
  }`

export const sucursalQuery = gql
  `query($id: ID!){
    data : sucursal(id: $id){
      id
      nombre
      localizacion
      ciudad{
        id
      }
      creadoEn
      usuario{
        id
      }
      ip
      puerto
      direccion
      nroDelivery
      depositoPredeterminado
      deposito
      codigoEstablecimientoFactura
      isConfigured
    }
  }`

export const sucursalActualQuery = gql
  `query{
    data : sucursalActual{
      id
      nombre
      ciudad{
        id
      }
      ip
      puerto
      direccion
      nroDelivery
      depositoPredeterminado
      deposito
      codigoEstablecimientoFactura
      isConfigured
    }
  }`

export const saveSucursal = gql
  `mutation saveSucursal($entity:SucursalInput!){
      data: saveSucursal(sucursal:$entity){
        id
        nombre
        localizacion
        ciudad{
          id
        }
        ip
        puerto
        direccion
        nroDelivery
        depositoPredeterminado
        deposito
        codigoEstablecimientoFactura
        isConfigured
      }
    }`

export const deleteSucursalQuery = gql
  ` mutation deleteSucursal($id: ID!){
      deleteSucursal(id: $id)
    }`
