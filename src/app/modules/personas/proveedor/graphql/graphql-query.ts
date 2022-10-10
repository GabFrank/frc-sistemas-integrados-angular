import gql from 'graphql-tag';

export const proveedoresQuery = gql
  `{
    data : proveedores{
      id
      persona{
        id
        nombre
      }
      vendedorList{
        id
        nombrePersona
      }
      credito
      tipoCredito
      productos{
        id
        descripcion
      }
    }
  }`

export const proveedoresSearchByPersona = gql
  `query($texto: String){
    data : proveedorSearchByPersona(texto: $texto){
      id
      persona{
        id
        nombre
      }
      vendedores{
        id
        persona{
          id
          nombre
        }
      }
      credito
      chequeDias
      tipoCredito
      productos{
        id
        descripcion
      }
    }
  }`

export const proveedoresSearchByProveedor = gql
  `query($texto: String){
    data : proveedorSearchByProveedor(texto: $texto){
      id
      persona{
        id
        nombre
      }
      vendedores{
        id
        nombrePersona
      }
      credito
      tipoCredito
      productos{
        id
        descripcion
      }
    }
  }`

export const proveedoresPorProveedor = gql
  `query($id: Int){
    data : proveedorPorVendedor(id: $id){
      id
      persona{
        id
        nombre
      }
      vendedorList{
        id
        nombrePersona
      }
      credito
      tipoCredito
      productos{
        id
        descripcion
      }
    }
  }`

export const proveedorQuery = gql
  `query($id: ID!){
    proveedor(id: $id){
      id
      persona{
        id
        nombre
      }
      vendedorList{
        id
        nombrePersona
      }
      credito
      tipoCredito
      productos{
        id
        descripcion
      }
    }
  }`

export const saveProveedor = gql
  `mutation saveProveedor($entity:ProveedorInput!){
      data: saveProveedor(proveedor:$entity){
        id
        credito
        chequeDias
        persona {
          id
          nombre
        }
      }
    }`

export const deleteProveedorQuery = gql
  ` mutation deleteProveedor($id: ID!){
    deleteProveedor(id: $id)
}`


