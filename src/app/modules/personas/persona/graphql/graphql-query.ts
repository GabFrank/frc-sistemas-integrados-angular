import gql from 'graphql-tag';

export const personasQuery = gql
  `{
    personas {
      id
      nombre
      apodo
      nascimiento
      sexo
      direccion
      telefono
      socialMedia
    }
  }`;

export const personasSearch = gql
  `query($texto: String){
    data : personaSearch(texto: $texto){
        id
        nombre
        apodo
        nacimiento
        sexo
        direccion
        telefono
        socialMedia
    }
  }`

export const personaQuery = gql
  `query($id: ID!){
    data : persona(id: $id){
        id
        nombre
        apodo
        nacimiento
        sexo
        direccion
        telefono
        socialMedia
        documento
    }
  }`

export const savePersona = gql
  `mutation savePersona($entity:PersonaInput!){
      data: savePersona(persona:$entity){
        id
        nombre
        apodo
        nacimiento
        sexo
        direccion
        telefono
        socialMedia
        documento
      }
    }`

export const deletePersonaQuery = gql
  ` mutation deletePersona($id: ID!){
      deletePersona(id: $id)
    }`
