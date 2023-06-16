import gql from "graphql-tag";

export const personasQuery = gql`
query ($page: Int) {
    data: personas(page: $page) {
      id
      nombre
      apodo
      nacimiento
      sexo
      direccion
      documento
      telefono
      socialMedia
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      isFuncionario
      isCliente
      isProveedor
      isUsuario
    }
  }
`;

export const personasSearch = gql`
  query ($texto: String) {
    data: personaSearch(texto: $texto) {
      id
      nombre
      apodo
      nacimiento
      documento
      sexo
      direccion
      telefono
      socialMedia
      creadoEn
      email
      usuario {
        id
        persona {
          nombre
        }
      }
      isFuncionario
      isCliente
      isProveedor
      isUsuario
    }
  }
`;

export const personaQuery = gql`
  query ($id: ID!) {
    data: persona(id: $id) {
      id
      nombre
      apodo
      nacimiento
      documento
      sexo
      direccion
      telefono
      socialMedia
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      isFuncionario
      isCliente
      isProveedor
      isUsuario
    }
  }
`;

export const savePersona = gql`
  mutation savePersona($entity: PersonaInput!) {
    data: savePersona(persona: $entity) {
      id
      nombre
      apodo
      nacimiento
      documento
      sexo
      direccion
      telefono
      socialMedia
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      isFuncionario
      isCliente
      isProveedor
      isUsuario
    }
  }
`;

export const deletePersonaQuery = gql`
  mutation deletePersona($id: ID!) {
    deletePersona(id: $id)
  }
`;
