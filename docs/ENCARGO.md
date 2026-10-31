# Prototipo mock del sistema de evaluación: encargo para el repo aparte

Encargo detallado para construir, en un **repo aparte del vault**, un prototipo visual con datos falsos que se le enseña al cliente. Está escrito para copiarse tal cual al repo nuevo (por ejemplo como `docs/ENCARGO.md`) y para que una sesión en la nube de Claude Code lo lea **sin acceso al vault ni al .docx del cliente**: por eso repite lo esencial de los requerimientos. Los requerimientos originales están en `planes/sistema-evaluacion-requerimientos-del-cliente` y las decisiones en `consideraciones/sistema-evaluacion-decisiones-del-mvp`; estas rutas son del vault de Juan y no existen en el repo del prototipo.

Convención de este documento: **[Doc x.y]** = sección del documento del cliente («Sistema de calificacione.docx»); **[Decidido]** = decisión tomada con Juan el 2026-10-31; **[Propuesta]** = sugerencia de este encargo que Juan puede cambiar.

---

## 1. Qué es y para qué sirve

- Prototipo **navegable** del Sistema Integral de Evaluación y Seguimiento de Grupo Inolite S. de R.L. de C.V. (sucursales Ferreisla y Ferretería La Gloria), para que el cliente vea cómo se sentiría el sistema antes de contratarlo.
- **Mock:** no hay servidor, base de datos, login real ni correos reales. Todo corre en el navegador con datos de ejemplo.
- Se publica gratis en **GitHub Pages** (dominio `juan436.github.io/prototipo-sistema-calificacion`), que solo sirve archivos estáticos.
- Cubre los **cuatro módulos** más el panel de administración, porque el MVP completo los incluye [Decidido].

## 2. Qué NO es (límites)

- No es el sistema de verdad ni se convierte en él: el sistema real es otro trabajo, con backend, base de datos y alojamiento en el VPS de Grupoinolite [Decidido].
- No guarda nada fuera del navegador de quien lo abre. Lo "guardado" vive en `localStorage` y se puede restablecer con un botón.
- No manda correos: cada correo se **muestra como vista previa** en pantalla.
- No contiene datos reales de empleados, clientes ni de la empresa. Todo nombre, teléfono y comentario es inventado.
- No presenta como del cliente nada que el cliente no haya entregado (ver sección 9).

## 3. Reglas de contenido: qué se puede mostrar y qué no

1. **Lo que el documento define se reproduce con exactitud:** textos de la pregunta, las cinco opciones, qué aparece según la respuesta, campos de la queja, datos que se guardan, contenido de cada correo, roles y filtros del panel.
2. **Lo que el documento no define se marca visiblemente como «por definir»** en la pantalla o en una nota del prototipo, y no se inventa una regla. Ejemplos: duración del periodo de la encuesta, quién recibe cada correo, qué pasa si una tableta pierde internet, cuánto tiempo se conserva la información.
3. **Preguntas de los formularios:** el cliente todavía no entrega las suyas (encuesta anónima, desempeño, reporte disciplinario, acta). Las del prototipo son **de ejemplo**, y cada formulario lleva una etiqueta «Preguntas de ejemplo; las reales las entrega el cliente». Los puntos y ponderaciones también son de ejemplo.
4. **Banner fijo** en todo el prototipo: «Prototipo con datos de ejemplo».
5. Nada de estimaciones, precios ni plazos dentro del prototipo.

## 4. Repositorio

- **Nombre y ubicación:** `prototipo-sistema-calificacion`, ya creado en `https://github.com/juan436/prototipo-sistema-calificacion` (clon local en `F:\documentos\Area de trabajo\trabajo-dev-juan-villegas\prototipo-sistema-calificacion`). Hoy solo tiene un `README.md` de una línea y un commit en `main`.
- **Visibilidad:** GitHub Pages con dominio gratis requiere repo **público** (en repos privados Pages exige plan de pago). Por eso el repo no lleva datos reales, claves, el .docx del cliente ni el vault. Este encargo, si se copia, queda público: está escrito sin datos sensibles.
- **Rama principal:** `main`. Las sesiones en la nube trabajan en ramas y Juan decide qué se mezcla.
- **Gestor de paquetes: `pnpm`, nunca `npm`**, desde el primer comando.
- **Commits** sin la línea `Co-Authored-By`.
- **Idioma** [Propuesta]: código, nombres de archivos y de variables en inglés; todo el texto que ve el usuario en español neutro de México, tuteando, sin regionalismos de otros países.

## 5. Stack [Propuesta]

| Pieza | Elección | Por qué |
|-------|----------|---------|
| Build | Vite + React + TypeScript | Genera estático puro, rápido de montar |
| Rutas | `react-router-dom` con **`HashRouter`** | Evita el error 404 al recargar en GitHub Pages |
| Estilos | Tailwind CSS | Rápido para el diseño sencillo que pide el cliente |
| Gráficas | Recharts | Barras, líneas y pastel sin configuración pesada |
| Estado | Un store pequeño (Zustand) persistido en `localStorage` | El flujo de la demo "recuerda" lo que se llenó |
| Datos | Archivos TypeScript/JSON dentro de `src/mock/` | Fuente única de los datos falsos |
| PDF | Vista de impresión con `window.print()` y estilos `@media print` | El documento pide imprimir; no hace falta librería |
| Pruebas | Vitest, solo para la lógica de cálculo y versionado | Lo demás es visual |

Todas las versiones **fijadas** (sin `^`) y `pnpm-lock.yaml` versionado.

## 6. Publicación en GitHub Pages

- Configurar `base` de Vite con el nombre del repo: `base: '/prototipo-sistema-calificacion/'`.
- Workflow `.github/workflows/deploy.yml` que, al hacer push a `main`: instala con `pnpm install --frozen-lockfile`, corre `pnpm build` y publica `dist/` con las acciones oficiales `actions/upload-pages-artifact` y `actions/deploy-pages`.
- Una sola acción manual de Juan: en el repo, **Settings → Pages → Source: GitHub Actions**.
- Entregable de publicación: la URL pública funcionando, anotada en el `README.md`.

## 7. Estructura de carpetas del repo

```
prototipo-sistema-calificacion/
├── README.md                  ← qué es, cómo correrlo, URL pública, aviso de datos falsos
├── CLAUDE.md                  ← reglas para sesiones de Claude (sección 4 y 13 de este encargo)
├── docs/
│   └── ENCARGO.md             ← copia de este documento
├── .github/workflows/deploy.yml
├── package.json  pnpm-lock.yaml  vite.config.ts  tsconfig.json  tailwind.config.ts
└── src/
    ├── main.tsx  App.tsx  routes.tsx
    ├── mock/                  ← branches, users, forms, evaluations, complaints, periods...
    ├── store/                 ← estado persistido y "restablecer demo"
    ├── lib/                   ← cálculo de notas, versionado de formularios, filtros de estadísticas
    ├── components/            ← botones grandes, tablas, gráficas, vista previa de correo, banner
    └── features/
        ├── access/            ← entrada por rol, activación de tableta
        ├── customer-rating/   ← módulo 1 (tableta)
        ├── anonymous-survey/  ← módulo 2
        ├── performance/       ← módulo 3
        ├── disciplinary/      ← módulo 4
        ├── dashboard/         ← panel y estadísticas
        └── admin/             ← formularios, usuarios, tabletas, correos
```

## 8. Diseño visual [Doc 2]

- Sencillo, moderno, intuitivo.
- **Fondo predominantemente blanco**, colores discretos y agradables, compatibles con la identidad de Grupo Inolite. El logo y la paleta oficial **no los tenemos**: se usa una paleta neutra con un color de acento sobrio y se deja un lugar para el logo. Pregunta abierta para Juan (sección 14).
- **Botones grandes**, formularios breves, navegación sin pasos innecesarios.
- Adaptable a computadoras y tabletas; el panel del administrador también debe verse bien en un teléfono [Doc 12].
- La pantalla de clientes se diseña **para tableta horizontal y vertical**, con letra grande y sin menús.

## 9. Acceso y roles (simulado) [Doc 2, 7]

- **Página de entrada** con selector «Entrar como…»: Administrador general, Gerente (de Ferreisla o de La Gloria), Empleado. Sin contraseña real; es un menú para la demo.
- **Acceso independiente de la tableta** [Doc 2]: ruta aparte, que no aparece en la entrada normal.
- Permisos que el prototipo debe respetar visualmente:
  - Administrador: todo, ambas sucursales, configuración de formularios y usuarios.
  - Gerente: evaluar desempeño, elaborar reportes disciplinarios y consultar a **sus** empleados; no ve otros.
  - Empleado: sus evaluaciones y su historial, y contestar la encuesta anónima; no ve expedientes de otros ni respuestas anónimas.
  - Cliente: solo el formulario de la tableta, sin cuenta.
- Pantalla «Recuperar cuenta» [Doc 10]: formulario simulado que muestra un mensaje de confirmación.
- Aviso de privacidad [Doc 10]: página con texto de ejemplo, enlazada en el formulario del cliente y en el acceso de empleados.

## 10. Módulo 1: clientes califican a la empresa [Doc 3]

### 10.1 Activación de la tableta [Decidido]
- Primera pantalla de la ruta de tableta: «Escribe el código de activación». El código lo genera el administrador (ver 14.3). En la demo, cualquier código generado en el panel funciona, y se muestra uno de ejemplo en una nota.
- Al activar: se elige/asigna la sucursal que trae el código, y la tableta queda "autorizada" (marca guardada en el navegador). Sin esa marca, la ruta del formulario muestra «Esta tableta no está autorizada».
- Importante para la narrativa: **el cliente nunca ve ni usa un código**; solo el personal, una vez por tableta.

### 10.2 Formulario del cliente [Doc 3.1, 3.2]
- Pregunta: **«¿Cómo fue tu experiencia en Ferreisla?»** o **«¿…en Ferretería La Gloria?»**, según la sucursal de la tableta.
- Cinco opciones, en este orden: **Excelente, Bien, Regular, Mal, Muy mal**.
- Si elige **Excelente:** opción de felicitar a uno o varios empleados que lo atendieron (se listan los vendedores y cajeros **de esa sucursal**) y de dejar un comentario. Ambos **opcionales**.
- Si elige **Bien o Regular:** puede terminar de inmediato.
- Si elige **Mal o Muy mal:** formulario opcional de queja con: «¿Quién te atendió?» (selección de empleado), «¿Qué sucedió?» (texto libre), «Teléfono de contacto». **Ningún campo es obligatorio**; se puede enviar sin dar datos personales.
- Pantalla final de agradecimiento que vuelve sola al inicio tras unos segundos (la tableta queda lista para el siguiente cliente) [Doc 12].

### 10.3 Qué se guarda [Doc 3.3]
Cada envío crea un registro con: sucursal, fecha y hora exactas, calificación, empleado(s) mencionado(s), comentario, felicitación o queja, y teléfono solo si el cliente lo dio. Las dos sucursales quedan separadas.

### 10.4 Alertas y reportes [Doc 3.4]
- **Alerta inmediata:** si la calificación es «Muy mal» o hay una queja, se muestra la **vista previa del correo al administrador designado** con sucursal, fecha, hora, empleado señalado y comentario.
- **Resumen mensual:** vista previa del correo con total de evaluaciones, cantidad y porcentaje por calificación, gráficas de distribución, comparación entre sucursales, felicitaciones por empleado y quejas/comentarios.
- **Consulta manual** de las estadísticas con un periodo de fechas personalizado (parte del panel, sección 15).

## 11. Módulo 2: empleados evalúan a la empresa, anónimo [Doc 4]

- **Vista del empleado:** si hay un periodo abierto, ve «Evaluación del mes» con el formulario; si ya contestó, ve «Ya participaste» y **nunca** sus respuestas; si no hay periodo abierto, ve que no hay evaluación disponible. Un empleado envía una sola por periodo [Doc 4.4: «podrá enviar una sola»; el documento no dice si es obligatorio, se muestra como regla del prototipo].
- **Formulario:** preguntas de ejemplo con valores; el sistema registra respuestas, calcula puntuaciones, suma o resta puntos según reglas de ejemplo, promedia por área, separa sucursales y permite ver resultados generales [Doc 4.3].
- **Comentarios anónimos:** campo opcional, "si el formulario los contempla" [Doc 4.5].
- **Vista del administrador:**
  - Periodos: crear periodo con fecha de apertura y cierre [Doc 4.4]. La duración y el día de apertura quedan marcados «por definir».
  - Participación: quién ya evaluó, quién está pendiente y el porcentaje por sucursal [Doc 4.2].
  - Resultados: número de participantes, porcentaje de participación, promedio general, calificación por área, resultados por sucursal, **comparación con meses anteriores**, comentarios anónimos [Doc 4.5], con histórico para ver tendencias.
  - Vista previa del correo que se envía automáticamente al cerrar el periodo.
- **Anonimato [Decidido]:** el prototipo debe mostrar claramente que la lista de participación y las respuestas son cosas separadas. En los datos de ejemplo hay **dos colecciones distintas** (`participation` y `anonymousResponses`), y las respuestas **no contienen ningún dato del empleado**. Se agrega una nota explicativa para el cliente: «Se sabe quién participó, pero no qué contestó cada persona». No se muestran detalles técnicos adicionales sobre horas ni umbrales.

## 12. Módulo 3: gerentes evalúan a los empleados [Doc 5]

- **Captura (gerente):** elegir empleado (solo los suyos), elegir periodo evaluado, contestar cada apartado, ver la **calificación calculada automáticamente**, registrar observaciones y comentarios, y guardar en el expediente [Doc 5.2].
- **Confirmar y enviar:** al confirmar, vista previa del correo al empleado con periodo evaluado, calificación final, calificaciones por área, comentarios y observaciones, y resultado general; más los anexos del punto 12.3 [Doc 5.5].
- **Expediente individual** [Doc 5.3]: calificación mensual, calificación por área, promedio histórico, evolución (gráfica de línea), comentarios de gerentes, felicitaciones de clientes y reportes disciplinarios. Las calificaciones nuevas entran **automáticamente** al promedio histórico. Las evaluaciones anteriores se consultan en modo **solo lectura**, sin riesgo de modificarlas por accidente.
- **Modificación** [Doc 5.4]: un usuario autorizado puede modificar una evaluación cuando hay aclaración o revisión. Cada cambio queda registrado de forma permanente con **calificación original, calificación modificada, fecha y hora, usuario y motivo**. El historial de cambios **no se puede borrar** (no hay botón de borrar). Tras el cambio se muestra la vista previa de la **versión actualizada** del correo al empleado.
- **Vista del empleado:** ve sus evaluaciones, su historial y sus anexos desde su cuenta; no ve otros expedientes.

### 12.3 Calificación oficial y anexos (parte final del documento)
- La nota mensual se calcula **solo** con el formulario de desempeño del gerente.
- **No suman ni restan:** felicitaciones de clientes, quejas o comentarios negativos de clientes, reportes disciplinarios ni actas administrativas. Se muestran como **anexos independientes** del expediente, ligados al periodo.
- El correo al empleado se divide en: **Evaluación oficial** (calificación final, desglose por áreas, comentarios del gerente), **Anexo de atención al cliente** (felicitaciones, quejas y comentarios del periodo, si existen) y **Anexo disciplinario** (reportes y actas del periodo, si existen).
- Los anexos son informativos: una nota en pantalla lo dice. En los datos de ejemplo debe haber un empleado con anexos y una nota que **no cambia** por ellos, para que se vea.

## 13. Módulo 4: reportes disciplinarios y actas [Doc 6]

- El gerente elige empleado (de los suyos) y llena el formulario con: nombre del empleado, sucursal, fecha y hora del incidente, descripción de los hechos, tipo de incidencia, observaciones adicionales y nombre del gerente que elabora [Doc 6.2]. **Los campos definitivos salen del formato de la empresa, que no tenemos:** se marca «campos de ejemplo».
- El reporte se puede **guardar en el expediente, consultar después, exportar a PDF e imprimir para recabar firmas** [Doc 6.3]: vista de impresión con espacios para firmas, y botón «Imprimir / guardar como PDF».
- **Acta administrativa:** se genera a partir de un reporte, con formato de ejemplo y vista de impresión [Doc 6.3].
- Los documentos generados quedan en el historial del empleado.

## 14. Panel de administración y herramientas del administrador

### 14.1 Panel y estadísticas [Doc 8]
- **Filtros:** sucursal (Ferreisla, La Gloria o ambas), periodo (fechas personalizadas, mes o año), tipo de evaluación, y empleado cuando corresponda.
- **Satisfacción de clientes:** total de evaluaciones, porcentaje por calificación, felicitaciones por empleado, quejas recibidas, evolución mensual.
- **Empleados a empresa:** participación mensual, calificación general, resultados por área, comparación entre sucursales, evolución histórica.
- **Desempeño de empleados:** calificaciones mensuales, promedios individuales, evolución, felicitaciones recibidas, reportes disciplinarios.
- Gráficas fáciles de interpretar. Botones «Exportar a Excel» y «Exportar a PDF» (son deseables, «preferentemente»): en el mock exportan un archivo de ejemplo o muestran el aviso «Disponible en la versión real».

### 14.2 Formularios dinámicos y versionados [Decidido]
- Editor de formularios: el administrador **agrega, quita y reordena preguntas** y cambia sus valores sin programador [Doc 4.3, 12].
- **Versionado:** un formulario que ya tiene respuestas no se edita; al guardar cambios se crea una **versión nueva** y la anterior queda intacta. Cada evaluación guarda la versión con la que se hizo.
- Al abrir un histórico se muestra con **las preguntas y puntos de su versión**, y una etiqueta «Versión 1 · usada en marzo». La demo debe incluir un formulario con dos versiones y evaluaciones de cada una para que se vea la diferencia.
- Un formulario por tipo, **sin departamentos**: clientes, encuesta anónima, desempeño, reporte disciplinario y acta administrativa [Decidido].

### 14.3 Tabletas [Decidido]
- Lista de tabletas con sucursal y estado (autorizada o revocada).
- «Agregar tableta»: elegir sucursal y generar un **código de un solo uso** que se muestra en pantalla. Al usarlo en la ruta de tableta, el código queda consumido.
- «Desautorizar»: la tableta deja de funcionar y vuelve a mostrar «no autorizada».

### 14.4 Usuarios [Doc 12]
- Lista de empleados y gerentes, con sucursal, rol y correo; **agregar** un empleado y **desactivar** un usuario de forma sencilla. Un empleado desactivado conserva todo su historial.
- Un empleado tiene un identificador único que une sus evaluaciones, promedio, felicitaciones, reportes e historial, y no se pierde al cambiar de gerente ni de sucursal [Doc 9]. En la demo hay un empleado trasladado de sucursal para mostrarlo.

### 14.5 Correos [Doc 11]
Pantalla de configuración con la tabla de eventos y un campo para el destinatario configurable de los correos administrativos:

| Evento | Destinatario | Momento |
|--------|--------------|---------|
| Queja de cliente | Administrador | Inmediato |
| Calificación «Muy mal» | Administrador | Inmediato |
| Resumen de satisfacción | Administración | Mensual |
| Resultados de empleados a empresa | Administración | Al cerrar el periodo |
| Evaluación de desempeño | Empleado evaluado | Al confirmar la evaluación |
| Modificación de evaluación | Empleado evaluado | Al confirmar el cambio |

El destinatario real y la cantidad de personas que reciben cada correo están **por definir**.

### 14.6 Seguridad y conservación [Doc 10]
Una pantalla informativa (no funcional) que lista lo que el sistema real incluirá: inicio de sesión seguro, permisos por tipo de usuario, copias de seguridad automáticas, registro de modificaciones, recuperación de cuentas, conservación del historial y aviso de privacidad. El tiempo de conservación queda «por definir».

## 15. Datos de ejemplo (mock)

Todo inventado y coherente entre sí. Mínimo:

- **2 sucursales:** Ferreisla y Ferretería La Gloria.
- **12 a 16 empleados** repartidos entre ambas (vendedores y cajeros), **2 gerentes** (uno por sucursal) y **1 administrador**. Nombres ficticios y genéricos; ningún nombre real.
- **Evaluaciones de clientes:** 3 meses de historia, de unas 40 a 60 por sucursal, con mezcla de las cinco calificaciones, felicitaciones a varios empleados, 4 a 6 quejas y 2 casos «Muy mal» que disparan alerta.
- **Encuesta anónima:** 3 periodos cerrados con participación distinta por sucursal y un periodo abierto con parte del personal pendiente; comentarios anónimos de ejemplo.
- **Evaluaciones de desempeño:** 3 meses para cada empleado, con una evaluación **modificada** (historial con original, nuevo valor, motivo, usuario y hora).
- **Un empleado con anexos** (una felicitación, una queja y un reporte disciplinario con acta) cuya nota mensual no cambia por ellos.
- **Un formulario con 2 versiones**, con evaluaciones hechas en cada una.
- **Un empleado trasladado** de sucursal con historial completo.
- **2 tabletas** autorizadas y una revocada.
- Botón **«Restablecer datos de la demo»** visible en el menú del administrador.

## 16. Trazabilidad: documento del cliente contra pantalla

| Doc | Qué pide | Dónde se ve |
|-----|----------|-------------|
| 1 | Cuatro funciones; sucursales separadas y consolidadas | Panel con filtro de sucursal; los cuatro módulos |
| 2 | Diseño blanco, botones grandes, tabletas y computadoras; acceso de tabletas independiente | Estilo general; ruta de tableta aparte |
| 3.1 a 3.3 | Pregunta, cinco opciones, ramas, datos guardados | Sección 10.2 y 10.3 |
| 3.4 | Alerta inmediata y resumen mensual; consulta por fechas | Sección 10.4 y panel |
| 3.5 | Autorización por dispositivo | Sección 10.1 y 14.3 |
| 4.2 a 4.5 | Participación, anonimato, formulario, periodos, reporte | Sección 11 |
| 5.2 a 5.5 | Captura, expediente, modificación con historial, correo | Sección 12 |
| 6.1 a 6.3 | Reporte, PDF, impresión, acta, historial | Sección 13 |
| 7 | Roles | Sección 9 |
| 8 | Panel, filtros, indicadores, exportación | Sección 14.1 |
| 9 | Identificador único, anónimas separadas | Sección 14.4 y 11 |
| 10 | Seguridad, recuperación de cuentas, aviso de privacidad | Sección 9 y 14.6 |
| 11 | Correos automáticos y destinatarios configurables | Sección 14.5 |
| 12 | Formularios sin tocar código, altas y bajas, historial, estadísticas, móvil | Sección 14.2 y 14.4 |
| Final | Calificación oficial y anexos | Sección 12.3 |

## 17. Criterios de entrega

El prototipo está listo cuando:
1. La URL pública de GitHub Pages abre y las rutas funcionan al recargar.
2. Un recorrido completo de cada módulo se puede hacer sin errores en una tableta y en una computadora.
3. Cada pantalla de la tabla de la sección 16 existe.
4. Cada cosa «por definir» está marcada visiblemente y no se inventó una regla.
5. No hay datos reales, claves ni archivos del cliente en el repo.
6. `pnpm build` termina sin errores y `pnpm test` pasa.
7. El `README.md` explica qué es, cómo correrlo y recuerda que los datos son falsos.

## 18. Cómo trabajar la sesión en la nube

1. Juan crea el repo vacío en GitHub y lo vincula a la sesión en la nube.
2. Se copia este documento al repo como `docs/ENCARGO.md` y un `CLAUDE.md` corto con las reglas de la sección 4 (pnpm, commits sin `Co-Authored-By`, idiomas, no inventar datos del cliente).
3. Prompt inicial sugerido: «Lee `docs/ENCARGO.md` completo y construye el prototipo mock descrito, módulo por módulo, empezando por el esqueleto del repo, el despliegue en GitHub Pages y el módulo 1. No inventes reglas del cliente: marca lo que esté por definir. Trabaja en una rama y haz un commit por módulo.»
4. Orden sugerido [Propuesta]: esqueleto y despliegue, módulo 1, formularios dinámicos y versionados, módulo 2, módulo 3, módulo 4, panel, pulido y datos de ejemplo.
5. Cuando haya una URL pública, Juan la revisa contra la sección 17 antes de enseñársela al cliente.

## 19. Preguntas abiertas para Juan

- ¿Hay logo y colores oficiales de Grupo Inolite para el prototipo, o se usa paleta neutra?
- ¿El repo es público? Es necesario para el dominio gratis de Pages, y este encargo quedaría visible. Sin confirmar.
- ¿Se enseña también el prototipo de la tableta en modo horizontal y vertical, o solo en uno?
- ¿La demo debe incluir un recorrido guiado o se deja libre?

