1. Descripción general del proyecto

Noche de película es una funcionalidad nueva para Mi Cartelera Personal. El usuario indica cuánto tiempo tiene libre y la app le muestra qué películas de su lista «por ver» caben en ese tiempo. Con ellas arma una sesión y la guarda para después.

Cada estudiante la construye sobre su propio Proyecto 3, sin reescribirlo, siguiendo el proceso de los talleres de harness engineering y spec-driven development. Antes de escribir código nuevo, entiende y documenta lo que ya existe; después especifica la épica, la implementa por tickets con un agente de IA, la verifica y la audita.

En este proyecto el código no es el único entregable. Se evalúa también la cadena de documentos que lo justifica: PRD, historias, criterios, tickets, specs, sistema de diseño, verificación y auditoría. El historial de git debe mostrar cada documento antes que el código que lo implementa.


1.3 La épica: ficha del cliente

Esta ficha es el punto de partida del PRD de la épica. Tiene huecos a propósito: encontrarlos con la IA y resolverlos es parte del proyecto.

FICHA DE HECHOS — NOCHE DE PELÍCULA (Mi Cartelera Personal)

- Quién lo usa: el mismo usuario de Mi Cartelera, con su cuenta y su lista.
- Problema: tiene muchas películas «por ver», pero cuando tiene un rato libre no sabe cuáles caben en ese tiempo. Empieza algo que no alcanza a terminar.
- Qué quiere: decir cuánto tiempo tiene, ver qué películas de su lista caben, armar una sesión con una o varias y guardarla para esa noche.
- Regla del cliente: una sesión cabe si la suma de las duraciones, más las pausas entre películas, no supera el tiempo disponible.
- Éxito: el usuario termina lo que empieza.
- NO-alcance: series, ver con amigos o compartir sesiones, recordatorios y notificaciones, sincronizar con plataformas de streaming o calendarios, y recomendar películas que no están en su lista.

Decisiones del cliente ya tomadas (van en "Reglas de negocio" del PRD):

Tema
	

Decisión

Tiempo disponible
	

Número entero de minutos, entre 30 y 600

Qué entra en una sesión
	

Solo películas de la lista del usuario en estado «por ver»

Pausas
	

10 minutos entre una película y la siguiente; no hay pausa antes de la primera ni después de la última

Límite exacto
	

Una sesión que ocupa exactamente el tiempo disponible sí cabe

Duración
	

Se toma de TMDB. Una película sin duración conocida no se puede agregar, y la app explica por qué

Estado de los títulos
	

Guardar una sesión no cambia el estado de sus películas: siguen «por ver»

Puntos que decide cada estudiante. Cada uno se resuelve en el PRD, como decisión justificada o como [SUPUESTO], y se refleja en los criterios:

    ¿Una película puede estar en dos sesiones guardadas?
    ¿En qué orden se muestran las películas que caben?
    ¿Se puede modificar una sesión después de guardarla?
    Si el usuario elimina de su lista una película que está en una sesión guardada, ¿qué pasa con esa sesión?
    ¿Una sesión tiene nombre o fecha?

Los casos borde que la IA proponga en el refinamiento (poke-holes) y no estén en esta lista se deciden igual: se aceptan o se rechazan con una razón escrita.

1.4 Requisitos obligatorios
A. Harness y punto de partida

    Harness en el repositorio: AGENTS.md de 40 líneas o menos, con la regla "ninguna funcionalidad sin spec" y las reglas de claves; CLAUDE.md que lo importe; skill /commit con disable-model-invocation; y hook PostToolUse que formatee con Prettier.
    Estado inicial: docs/ESTADO-INICIAL.md, escrito con el agente en plan mode. Describe qué hace hoy el Proyecto 3, su stack, sus inconsistencias, sus riesgos y la deuda pendiente.
    Nada se reescribe. Las funciones del Proyecto 3 siguen funcionando igual al final del proyecto.

B. Especificación

    PRD en docs/prd/: el producto completo, con el Proyecto 3 como épica E1 (ya construida) y Noche de película como épica E2. Incluye problema, usuarios, alcance, no-alcance, reglas de negocio, supuestos y puntos abiertos. Sin tablas, componentes ni librerías.
    Backlog en docs/backlog/:
        Al menos 3 historias de E2 en formato "Como / quiero / para", que pasen INVEST.
        Criterios DADO / CUANDO / ENTONCES sin detalle técnico.
        Registro del refinamiento con la IA: cada caso borde propuesto, aceptado o rechazado con su razón.
        Tickets con tipo, Definition of Done y dependencias.
    Spec de la épica en docs/specs/. Incluye el modelo de datos con su migración SQL y sus políticas RLS, las funciones puras del dominio, los servicios, los componentes, los criterios con DEBE / NO DEBE, una tabla criterio → verificación y una tabla ticket → archivos.
    Sistema de diseño:
        DESIGN.md en la raíz, coherente con Bootstrap: cómo se personaliza, qué componentes se usan y qué está prohibido.
        Su brand board en docs/diseno/brand-board.html.
        Criterios de diseño verificables con id.
        La spec de interfaz cita DESIGN.md por nombre, sin copiar valores.

C. Funcionalidad de la épica

    Pantalla "Noche de película", accesible solo con sesión iniciada.
    Tiempo disponible: el usuario lo indica y la app lo valida según las decisiones del cliente.
    Qué cabe:
        La app muestra las películas «por ver» que caben en ese tiempo, cada una con su duración.
        Las que no tienen duración aparecen como no disponibles, con el motivo.
        Mientras se consulta TMDB, hay estados de carga y de error.
    Armar la sesión:
        El usuario agrega y quita películas, y ve en todo momento la duración total (pausas incluidas) y el tiempo restante.
        Si una película no cabe en lo que queda, la app no la agrega y explica por qué.
    Guardar y consultar: la sesión se guarda en Supabase, y el usuario ve sus sesiones guardadas con su detalle.
    Seguridad real: políticas RLS que impiden que un usuario vea o modifique las sesiones de otro. Se demuestra con dos cuentas.

D. Calidad y verificación

    La regla vive en el dominio. El cálculo de "cabe" está en una función pura de src/dominio/, sin llamadas a red ni a Supabase, que recibe el tiempo, las duraciones y la pausa.
    Tests con Vitest de esa regla, incluidos los bordes:
        Sesión que ocupa exactamente el tiempo.
        Una sola película (sin pausa).
        Película sin duración.
        Tiempo fuera del rango permitido.
    TypeScript sin any. Los componentes no llaman a Supabase ni a TMDB; lo hacen los servicios.
    La API key de TMDB y las claves de Supabase, solo en variables de entorno y nunca en el repositorio.
    Verificación en el navegador: docs/VERIFICACION.md de la épica, con la columna "resultado obtenido" llenada por el estudiante.
    Auditoría: docs/AUDITORIA.md, con cada criterio en estado "cumple", "no cumple" o "sin verificar", y su evidencia.
    Historial: commits que muestren el orden harness → estado inicial → PRD → backlog → specs → código → verificación.

1.5 Requisitos opcionales (puntos extra)

Cada opcional sigue el mismo proceso: su historia, sus criterios y su lugar en la spec, antes del código.

    "Llenar mi noche": un botón que propone una combinación de películas que aprovecha el tiempo disponible, con su propia función pura y sus tests.
    Filtro por género al buscar qué cabe.
    Marcar una sesión como realizada, con sus películas pasando a «vista». Requiere documentar la decisión, porque contradice una regla actual.
    Validación también en la base de datos, para que una sesión que no cabe no se pueda guardar ni saltándose el frontend.
    Revisión adversarial: un subagente que revise cada cambio antes del commit.
    App publicada en GitHub Pages o Vercel, con un enlace funcional.