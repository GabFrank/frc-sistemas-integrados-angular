import gql from 'graphql-tag';

export const vendedoresQuery = gql
  `{
    vendedores{
      id
      nombrePersona
      persona {
        id
        nombre
      }
      observacion
      proveedores{
        id
        persona{
          nombre
        }
        productos{
          id
          descripcion
          imagenPrincipal
          productoUltimasCompras{
            cantidad
            precio
            creadoEn
            pedido{
              id
              proveedor{
                persona{
                  nombre
                }
              }
            }
          }
        }
      credito
      tipoCredito
      
      }
    }
  }`

export const vendedoresSearchByPersona = gql
  `query($texto: String){
    data : vendedoresSearchByPersona(texto: $texto){
      id
      persona {
        id
        nombre
      }
      observacion
      proveedores{
        id
        persona{
          nombre
        }
        productos{
          id
          descripcion
          imagenPrincipal
        }
      credito
      tipoCredito
      
      }
    }
  }`

export const vendedoresSearchByProveedor = gql
  `query($texto: String){
    vendedores : vendedorSearchByProveedor(texto: $texto){
      id
      nombrePersona
      persona {
        id
        nombre
      }
      observacion
      proveedores{
        id
        persona{
          nombre
        }
        productos{
          id
          descripcion
          imagenPrincipal
          productoUltimasCompras{
            cantidad
            precio
            creadoEn
            pedido{
              id
              proveedor{
                persona{
                  nombre
                }
              }
            }
          }
        }
      credito
      tipoCredito
      
      }
    }
  }`

export const vendedorQuery = gql
  `query($id: ID!){
    vendedor(id: $id){
      id
      nombrePersona
      persona {
        id
        nombre
      }
      observacion
      proveedores{
        id
        persona{
          nombre
        }
        productos{
          id
          descripcion
          productoUltimasCompras{
            cantidad
            precio
            creadoEn
            pedido{
              id
              proveedor{
                persona{
                  nombre
                }
              }
            }
          }
        }
      credito
      tipoCredito
      
      }
    }
  }`

export const saveVendedor = gql
  `mutation saveVendedor($entity:VendedorInput!){
      data: saveVendedor(vendedor:$entity){
        id
      }
    }`

export const deleteVendedorQuery = gql
  ` mutation deleteVendedor($id: ID!){
    deleteVendedor(id: $id)
}`


