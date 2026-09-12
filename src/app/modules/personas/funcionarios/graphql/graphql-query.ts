import gql from "graphql-tag";

export const funcionariosQuery = gql`
  query ($page: Int, $size: Int){
    data: funcionarios(page: $page, size: $size) {
      id
      credito
      diarista
      sueldo
      fechaIngreso
      creadoEn
      fasePrueba
      activo
      nickname
      persona {
        id
        nombre
        telefono
      }
      cargo {
        id
        nombre
      }
      supervisadoPor {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      horario {
        id
        descripcion
        horaEntrada
        horaSalida
      }
    }
  }
`;

export const funcionariosWithPageQuery = gql`
  query ($page: Int, $size: Int, $id: Int, $nombre: String, $sucursalIdList: [Int], $activo: Boolean, $cargoId: Int, $diarista: Boolean, $fasePrueba: Boolean, $cobraBanco: Boolean){
    data: funcionariosWithPage(page: $page, size: $size, id: $id, nombre: $nombre, sucursalIdList: $sucursalIdList, activo: $activo, cargoId: $cargoId, diarista: $diarista, fasePrueba: $fasePrueba, cobraBanco: $cobraBanco) {
        getTotalPages
        getTotalElements
        getNumberOfElements
        isFirst
        isLast
        hasNext
        hasPrevious
        getContent {
          id
          credito
          diarista
          sueldo
          fechaIngreso
          creadoEn
          fasePrueba
          activo
          nickname
          persona {
            id
            nombre
            telefono
          }
          cargo {
            id
            nombre
          }
          supervisadoPor {
            id
            persona {
              id
              nombre
            }
          }
          sucursal {
            id
            nombre
          }
          usuario {
            id
          }
          horario {
            id
            descripcion
            horaEntrada
            horaSalida
          }
        } 
      }
    }
`;

export const funcionariosSearch = gql`
  query ($texto: String) {
    data: funcionariosSearch(texto: $texto) {
      id
      credito
      diarista
      sueldo
      fechaIngreso
      creadoEn
      fasePrueba
      activo
      nickname
      persona {
        id
        nombre
        telefono
      }
      cargo {
        id
        nombre
      }
      supervisadoPor {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      horario {
        id
        descripcion
        horaEntrada
        horaSalida
      }
    }
  }
`;

// Version liviana del buscador y del lookup por persona: solo lo que necesita un
// autocomplete (id + persona). No pide horario ni datos de RRHH, por eso se puede
// usar contra la filial, donde administrativo.horario no se replica.
export const funcionariosSearchSimple = gql`
  query ($texto: String) {
    data: funcionariosSearch(texto: $texto) {
      id
      nickname
      activo
      persona {
        id
        nombre
      }
    }
  }
`;

export const funcionarioPorPersonaSimpleQuery = gql`
  query ($id: ID!) {
    data: funcionarioPorPersona(id: $id) {
      id
      nickname
      activo
      persona {
        id
        nombre
      }
    }
  }
`;

export const funcionarioQuery = gql`
  query ($id: ID!) {
    data: funcionario(id: $id) {
      id
      credito
      diarista
      sueldo
      fechaIngreso
      fechaEgreso
      motivoEgreso
      creadoEn
      fasePrueba
      activo
      nickname
      codigoInterno
      ipsActivo
      numeroIps
      fechaIngresoIps
      cobraBanco
      cuentaBancaria
      contactoEmergenciaNombre
      contactoEmergenciaTelefono
      persona {
        id
        nombre
        apodo
        telefono
        email
        direccion
        sexo
        socialMedia
        ciudad {
          id
          descripcion
        }
        documento
        nacimiento
        sexo
        direccion
        email
        socialMedia
        imagenes
        isFuncionario
        isCliente
        isProveedor
      }
      usuario {
        id
      }
      cargo {
        id
        nombre
      }
      supervisadoPor {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      horario {
        id
        descripcion
        horaEntrada
        horaSalida
      }
    }
  }
`;

export const funcionarioPorPersonaQuery = gql`
  query ($id: ID!) {
    data: funcionarioPorPersona(id: $id) {
      id
      credito
      diarista
      sueldo
      fechaIngreso
      creadoEn
      fasePrueba
      activo
      nickname
      persona {
        id
        nombre
        apodo
        telefono
        email
        direccion
        sexo
        socialMedia
        ciudad {
          id
          descripcion
        }
        nacimiento
        documento
      }
      usuario {
        id
      }
      cargo {
        id
        nombre
      }
      supervisadoPor {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      horario {
        id
        descripcion
        horaEntrada
        horaSalida
      }
    }
  }
`;

export const saveFuncionario = gql`
  mutation saveFuncionario($entity: FuncionarioInput!) {
    data: saveFuncionario(funcionario: $entity) {
      id
      credito
      diarista
      sueldo
      fechaIngreso
      creadoEn
      fasePrueba
      activo
      nickname
      codigoInterno
      ipsActivo
      numeroIps
      fechaIngresoIps
      cobraBanco
      cuentaBancaria
      contactoEmergenciaNombre
      contactoEmergenciaTelefono
      persona {
        id
        nombre
        telefono
      }
      cargo {
        id
        nombre
      }
      supervisadoPor {
        id
        persona {
          id
          nombre
        }
      }
      sucursal {
        id
        nombre
      }
      horario {
        id
        descripcion
        horaEntrada
        horaSalida
      }
    }
  }
`;

export const deleteFuncionarioQuery = gql`
  mutation deleteFuncionario($id: ID!) {
    deleteFuncionario(id: $id)
  }
`;
