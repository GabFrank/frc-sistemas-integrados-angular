import gql from 'graphql-tag';

export const contactosQuery = gql
  `{
    contactos{
      id
      email
      telefono
      persona{
        id
        nombre
      }
    }
  }`

export const contactosSearchByTelefonoOrNombre = gql
  `query($texto: String){
    contactos : contactoPorTelefonoONombre(texto: $texto){
      id
      email
      telefono
      persona{
        id
        nombre
      }
    }
  }`

export const contactoQuery = gql
  `query($id: ID!){
    contacto(id: $id){
      id
      email
      telefono
      persona{
        id
        nombre
      }
    }
  }`

export const saveContacto = gql
  `mutation saveContacto($entity:ContactoInput!){
      data: saveContacto(contacto:$entity){
        id
      }
    }`

export const deleteContactoQuery = gql
  ` mutation deleteContacto($id: ID!){
    deleteContacto(id: $id)
}`


