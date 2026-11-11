# E2 — Stories and acceptance criteria

Status: draft. Scope and assumptions come from the [PRD](../prd/mi-cartelera-personal.md). Criteria intentionally describe observable behavior without implementation details. DADO / CUANDO / ENTONCES are used as required by the assignment; the interface remains English.

## E2-US1 — Find movies for the time I have

**Como** usuario con una lista personal, **quiero** indicar cuánto tiempo tengo y ver mis películas pendientes que caben, **para** elegir algo que pueda terminar.

- **E2-AC01 — Access:** DADO que no he iniciado sesión, CUANDO intento acceder a Movie Night, ENTONCES debo iniciar sesión antes de ver contenido personal.
- **E2-AC02 — Budget:** DADO un tiempo vacío, no numérico, fraccionario, menor de 30 o mayor de 600, CUANDO lo envío, ENTONCES se explica el rango y el formato admitidos y no se inicia una planificación válida. DADO 30 o 600 minutos, CUANDO lo envío, ENTONCES se acepta ese límite.
- **E2-AC03 — Eligibility:** DADO que mi lista tiene películas pendientes, películas en otros estados y series, CUANDO consulto qué cabe, ENTONCES solo se ofrecen mis películas pendientes y cada película con duración conocida muestra sus minutos. Las entradas duplicadas del mismo título aparecen una sola vez.
- **E2-AC04 — Individual fit and order:** DADO un presupuesto válido de 100 minutos y películas de 90, 100 y 101 minutos, CUANDO consulto qué cabe, ENTONCES se ofrecen las de 90 y 100 en ese orden y la de 101 no se ofrece como agregable. Los empates se ordenan por título y una identidad estable.
- **E2-AC05 — Unknown duration:** DADO una película pendiente sin duración válida, CUANDO se presentan los resultados, ENTONCES aparece como no disponible con un motivo y no se puede agregar.
- **E2-AC06 — Retrieval states:** DADO que se están obteniendo duraciones, CUANDO espero resultados, ENTONCES veo una indicación de carga; DADO que una consulta falla, CUANDO termina, ENTONCES veo el fallo y puedo reintentarlo sin confundirlo con duración desconocida ni perder los resultados válidos de otras películas.
- **E2-AC07 — Empty states:** DADO que no tengo películas pendientes o ninguna con duración conocida cabe, CUANDO consulto qué cabe, ENTONCES veo el motivo correspondiente; las películas sin duración siguen identificadas como no disponibles.

## E2-US2 — Assemble a session that fits

**Como** usuario que encontró películas pendientes, **quiero** agregarlas y quitarlas de una sesión viendo su duración y sus pausas, **para** aprovechar mi tiempo sin excederlo.

- **E2-AC08 — Single movie and empty draft:** DADO una sesión vacía, CUANDO agrego una película de 90 minutos con 120 disponibles, ENTONCES el total es 90 y quedan 30; no se añade ninguna pausa. Al quitar la última película, total y pausas son cero y queda todo el presupuesto.
- **E2-AC09 — Breaks and exact fit:** DADO 200 minutos disponibles y una película de 90 seleccionada, CUANDO agrego una de 100, ENTONCES el total es 200 incluyendo una pausa de 10 y quedan cero minutos. La sesión es válida.
- **E2-AC10 — Over budget:** DADO el mismo presupuesto y una película de 90 seleccionada, CUANDO intento agregar una de 101, ENTONCES no se agrega, el borrador se conserva y se explica que película y pausa superarían el tiempo.
- **E2-AC11 — Removal and order:** DADO tres películas seleccionadas, CUANDO quito una, ENTONCES se conserva el orden de las restantes y se recalcula el total con una sola pausa. El orden de incorporación es el orden de visualización.
- **E2-AC12 — Repeated title:** DADO que una película ya está seleccionada, CUANDO intento agregarla otra vez, ENTONCES no se duplica y se explica que ya está incluida.
- **E2-AC13 — Reduced budget:** DADO un borrador válido, CUANDO reduzco el presupuesto por debajo del total o escribo un tiempo inválido, ENTONCES el borrador sigue visible, se explica el problema y no puedo agregar ni guardar hasta corregirlo. Puedo quitar películas.

## E2-US3 — Save my plan

**Como** usuario con una sesión preparada, **quiero** guardarla con un nombre, **para** recuperar mi plan sin volver a elegir las películas.

- **E2-AC14 — Name and minimum content:** DADO un nombre vacío, solo espacios o de más de 80 caracteres, o una sesión vacía, CUANDO intento guardar, ENTONCES se explica el problema y no se guarda. Un nombre con 1 u 80 caracteres después de quitar espacios externos es válido.
- **E2-AC15 — Successful save:** DADO una sesión válida y con nombre, CUANDO la guardo, ENTONCES se conserva como una sesión completa con orden, duraciones, pausas, presupuesto y momento de guardado; las películas siguen pendientes y se muestra el detalle guardado.
- **E2-AC16 — Failure and pending save:** DADO que estoy guardando, CUANDO intento guardar otra vez, ENTONCES no se inicia otro guardado concurrente; DADO que el guardado falla, CUANDO veo el error, ENTONCES conservo el borrador y puedo reintentar. No debe aparecer una sesión parcialmente guardada.
- **E2-AC17 — Changed source:** DADO que una película fue eliminada, cambió de estado o su duración cambió antes de guardar, CUANDO intento guardar, ENTONCES se solicita revisar el borrador con la información actual y no se guarda silenciosamente un plan distinto. Una duración que deja de estar disponible impide guardar esa selección.
- **E2-AC18 — Reuse across sessions:** DADO una película en una sesión guardada, CUANDO creo otra sesión válida con la misma película aún pendiente, ENTONCES puedo guardarla también.

## E2-US4 — Consult my saved sessions

**Como** usuario que guardó sesiones, **quiero** consultar mis planes y sus detalles, **para** recordar qué ver y cuánto tiempo reservé.

- **E2-AC19 — Saved list:** DADO que tengo sesiones guardadas, CUANDO las consulto, ENTONCES aparecen de la más reciente a la más antigua con nombre, momento de guardado y total; los empates tienen un orden estable. Si no tengo ninguna, veo un estado vacío.
- **E2-AC20 — Historical detail:** DADO una sesión guardada, CUANDO abro su detalle, ENTONCES veo sus películas en orden, duraciones guardadas, pausas, total, presupuesto y restante, aunque después elimine una película de mi lista o cambie su información. No se ofrecen edición, eliminación ni fecha de visualización programada.
- **E2-AC21 — Isolation:** DADO dos usuarios con sesiones distintas, CUANDO uno intenta consultar o modificar las sesiones del otro, ENTONCES no puede verlas ni modificarlas, incluso mediante un acceso que evite la navegación habitual. Una persona sin sesión tampoco puede hacerlo.
- **E2-AC22 — Draft lifecycle and regression:** DADO un borrador no guardado, CUANDO recargo o cierro sesión, ENTONCES no se conserva ni aparece en otra cuenta; los planes guardados sí vuelven al iniciar sesión con su propietario. Las funciones existentes de acceso, búsqueda, colección, edición y detalle siguen disponibles.

## INVEST review

- **Independent:** finding fitting movies has value without saving; assembling adds live planning; saving adds persistence; consulting adds retrieval. Stories share the domain model but remain separate user outcomes. Technical prerequisites are explicit ticket dependencies, not disguised user stories.
- **Negotiable:** S1–S12 are visible proposals; wording and interface composition can change while client rules remain fixed.
- **Valuable:** each story states its user benefit in “para”.
- **Estimable:** boundaries, failures, and expected behavior are defined; no optional optimizer, calendar, or social scope is hidden.
- **Small:** each story covers one stage of the workflow; implementation is split into bounded tickets.
- **Testable:** each E2-AC scenario has an observable result and a planned verification mapping in the epic spec.
