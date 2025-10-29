# Implementación de Cancelación de Documentos Electrónicos (DE) con Scheduler

## 1. Problema

El servicio de SIFEN para la cancelación de un Documento Electrónico (DE) no siempre devuelve una respuesta instantánea (síncrona). En muchos casos, la solicitud de cancelación queda en un estado `PENDIENTE` y debe ser consultada posteriormente para obtener el resultado final (Aprobado o Rechazado).

La implementación actual en `SifenEventoService` ya maneja la respuesta inicial, pero carece de un mecanismo para dar seguimiento a los eventos que quedan pendientes.

## 2. Solución Propuesta

Implementar un sistema basado en un **Scheduler** que periódicamente consulte a SIFEN sobre el estado de los eventos de cancelación que están pendientes y actualice el estado del evento y del Documento Electrónico correspondiente en la base de datos.

Este enfoque asegura una arquitectura robusta, resiliente y mejora la experiencia del usuario al no bloquear la interfaz esperando una respuesta síncrona.

## 3. Plan de Implementación

### Paso 1: Habilitar Scheduling en la Aplicación

Asegurarse de que la clase principal de la aplicación Spring Boot tenga la anotación `@EnableScheduling`.

**Archivo:** `FrancoSystemsApplication.java`

```java
@SpringBootApplication
@EnableScheduling // <-- Asegurarse de que esta línea exista
public class FrancoSystemsApplication {
    // ...
}
```

### Paso 2: Método en el Repositorio

Crear un método en la interfaz `EventoCancelacionDERepository` para buscar todos los eventos de cancelación que estén activos y en estado pendiente.

**Archivo:** `repository/financiero/EventoCancelacionDERepository.java`

```java
import com.franco.dev.domain.financiero.enums.EstadoEvento;
import java.util.List;

public interface EventoCancelacionDERepository extends JpaRepository<EventoCancelacionDE, EmbebedPrimaryKey> {
    // ... otros métodos
    List<EventoCancelacionDE> findByEstadoAndActivo(EstadoEvento estado, Boolean activo);
}
```

### Paso 3: Método en el Servicio

Crear un método correspondiente en `EventoCancelacionDEService` que utilice el nuevo método del repositorio.

**Archivo:** `service/financiero/EventoCancelacionDEService.java`

```java
public List<EventoCancelacionDE> findEventosPendientes() {
    return repository.findByEstadoAndActivo(EstadoEvento.PENDIENTE, true);
}
```

### Paso 4: Crear el Servicio de Consulta (`SifenConsultaService`)

Crear un nuevo servicio dedicado a la lógica de consulta a SIFEN. Esto mantiene la responsabilidad separada de `SifenEventoService`, que se enfoca en el *envío* de eventos.

**Archivo:** `service/sifen/SifenConsultaService.java` (Archivo Nuevo)

```java
package com.franco.dev.service.sifen;

// ... imports ...

@Slf4j
@Service
public class SifenConsultaService {

    @Autowired
    private EventoCancelacionDEService eventoCancelacionDEService;

    @Autowired
    private DocumentoElectronicoService documentoElectronicoService;

    @Transactional
    public void consultarYActualizarEventoCancelacion(EventoCancelacionDE evento) throws SifenException {
        if (evento.getProtocoloAutorizacion() == null || evento.getProtocoloAutorizacion().isEmpty()) {
            log.warn("El evento ID {} no tiene protocolo para ser consultado. Se omite.", evento.getId());
            return;
        }

        // Lógica para llamar a Sifen.consultaEvento(protocolo)
        RespuestaConsultaEvento respuesta = Sifen.consultaEvento(evento.getProtocoloAutorizacion());

        // Procesar la respuesta y actualizar la base de datos
        // (Esta lógica puede ser refactorizada desde SifenEventoService para no duplicar código)
        String xmlRespuesta = respuesta.getRespuestaBruta();
        String estadoResultado = extraerValorXML(xmlRespuesta, "<dEstRes>", "</dEstRes>");

        if ("Aprobado".equalsIgnoreCase(estadoResultado)) {
            evento.setEstado(EstadoEvento.APROBADO);
            evento.setFechaProcesamiento(LocalDateTime.now());
            
            DocumentoElectronico de = evento.getDocumentoElectronico();
            de.setEstado(com.franco.dev.domain.financiero.enums.EstadoDE.CANCELADO);
            
            documentoElectronicoService.save(de);
            log.info("SCHEDULER: Evento ID {} APROBADO. DE con CDC {} actualizado a CANCELADO.", evento.getId(), de.getCdc());

        } else if ("Rechazado".equalsIgnoreCase(estadoResultado)) {
            evento.setEstado(EstadoEvento.RECHAZADO);
            evento.setFechaProcesamiento(LocalDateTime.now());
            log.error("SCHEDULER: Evento ID {} RECHAZADO por SIFEN.", evento.getId());
        
        } else {
             log.info("SCHEDULER: Evento ID {} sigue PENDIENTE. Se reintentará.", evento.getId());
             return; 
        }

        evento.setRespuestaBruta(xmlRespuesta);
        eventoCancelacionDEService.save(evento);
    }
    
    private String extraerValorXML(String xml, String tagInicio, String tagFin) {
        // ... Lógica para extraer valor del XML
    }
}
```

### Paso 5: Crear el Scheduler (`EventoSifenScheduler`)

Crear el componente que contendrá la tarea programada.

**Archivo:** `scheduler/EventoSifenScheduler.java` (Archivo Nuevo)

```java
package com.franco.dev.scheduler;

// ... imports ...

@Slf4j
@Component
public class EventoSifenScheduler {

    @Autowired
    private EventoCancelacionDEService eventoCancelacionDEService;

    @Autowired
    private SifenConsultaService sifenConsultaService;

    /**
     * Se ejecuta cada 5 minutos para consultar el estado de los eventos de cancelación pendientes.
     */
    @Scheduled(fixedRate = 300000) // 5 minutos
    public void consultarEventosDeCancelacionPendientes() {
        log.info("SCHEDULER: Iniciando consulta de eventos de cancelación pendientes...");
        List<EventoCancelacionDE> eventosPendientes = eventoCancelacionDEService.findEventosPendientes();

        if (eventosPendientes.isEmpty()) {
            log.info("SCHEDULER: No se encontraron eventos pendientes.");
            return;
        }

        log.info("SCHEDULER: Se encontraron {} eventos pendientes.", eventosPendientes.size());

        for (EventoCancelacionDE evento : eventosPendientes) {
            try {
                sifenConsultaService.consultarYActualizarEventoCancelacion(evento);
            } catch (Exception e) {
                log.error("SCHEDULER: Error al procesar el evento ID {}: {}", evento.getId(), e.getMessage());
            }
        }
        log.info("SCHEDULER: Fin de la consulta de eventos.");
    }
}
```
