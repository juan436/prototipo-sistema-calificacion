# Cambios pedidos por el cliente tras ver el prototipo

Estos cambios **no estaban** en el documento original del cliente. Los pidió después de ver el prototipo. Todos los nombres de los ejemplos son inventados, igual que el resto de los datos de la demo.

Lo que no esté escrito aquí no se agrega. Lo que el cliente no definió se marca «Por definir».

---

## 1. Sesión de cajero en cada tableta

### Qué pidió el cliente

Quiere dar bonos por atención al cliente y saber en qué turno de cajero hay mejor o peor atención. Para eso cada calificación debe quedar ligada al cajero que estaba en caja cuando el cliente la hizo.

### Cómo funciona

- Cada sucursal tiene **varias cajas**. Cada caja tiene **su propia tableta**, que solo se usa para el formulario del cliente.
- En la tableta hay siempre un cajero «en sesión». La sesión queda abierta **indefinidamente**, hasta que alguien la cambie. No se cierra sola.
- **No hay horario de turno.** El empleado que llega no escribe «mi turno es de tal hora a tal hora». Solo se busca en el select y se elige. **El turno es simplemente el cambio de empleado en la caja.**
- El cliente **nunca** ve ni toca esto. El menú es discreto, en una esquina de la pantalla.

### Pantalla

1. Una esquina de la tableta muestra, en letra pequeña, el nombre del cajero actual.
2. Al tocarlo se abre un menú (dropdown) con el nombre del cajero actual y debajo un botón **«Cambiar cajero»**.
3. Al pulsar el botón se pide un **PIN de 4 dígitos**.
4. Si el PIN es correcto, aparece un select con los cajeros **de esa sucursal**. Se busca al nuevo y se confirma.
5. La tableta vuelve a la pantalla del cliente, ya a nombre del cajero nuevo.

**El PIN es uno solo por tableta**, no uno por cajero. Se muestra uno de ejemplo en una nota de la demo. El administrador lo define al agregar la tableta.

### Qué se guarda en cada calificación

Además de lo que ya se guardaba (sucursal, fecha y hora, calificación, empleado mencionado, comentario o queja, teléfono si lo dio):

- La **tableta o caja** donde se hizo.
- El **cajero en sesión** en ese momento.

El turno no se guarda aparte: sale de la hora en que un cajero entró en sesión y la hora en que el siguiente la cambió.

### Ejemplo real

Ferreisla tiene dos cajas. La Caja 1 y la Caja 2 tienen cada una su tableta.

- A las 8:00 Mariana López se pone en la Caja 1. Abre el menú de la tableta, pulsa «Cambiar cajero», escribe el PIN de esa tableta y se elige en el select.
- Entre las 8:00 y las 14:00 llegan 20 calificaciones en esa tableta. Las 20 quedan a nombre de Mariana.
- A las 14:00 llega Carlos Vega. Abre el menú, pulsa «Cambiar cajero», escribe el PIN, busca a Carlos y confirma.
- Desde ese momento, las calificaciones nuevas de la Caja 1 quedan a nombre de Carlos.
- En el panel, el administrador ve que el turno de Mariana tuvo mejor calificación que el de Carlos, y puede usarlo para el bono.

### Datos de ejemplo que deben existir en la demo

- Al menos **2 cajas por sucursal**, cada una con su tableta.
- Una tableta con **dos cajeros distintos** en sesión a lo largo de los 3 meses de historia, para que se vea la diferencia entre turnos.
- Calificaciones con cajero asignado en todas las de ejemplo.
- Una nota visible con el PIN de ejemplo.

### Por preguntar al cliente

Si el cliente señala a **otro empleado** en «¿Quién te atendió?», ¿esa calificación cuenta para el bono del cajero en sesión, o solo para el empleado señalado? Mientras no se responda, se marca **«Por definir»**.

**Respondido:** el formulario del cliente ya **no pregunta «¿Quién te atendió?»**. La calificación y la queja quedan ancladas al cajero en sesión en esa caja en el momento en que el cliente califica. Si el cliente elige «Excelente», «¿Quieres felicitar a quien te atendió?» se contesta solo con **Sí** o **No**, sin elegir empleado: la felicitación va al cajero en sesión.

---

## 2. Color en cada calificación

El cliente pidió que la calificación del cliente tenga color.

Color por opción:

| Calificación | Color |
|---|---|
| Excelente | Verde fuerte |
| Bien | Verde claro |
| Regular | Amarillo |
| Mal | Naranja |
| Muy mal | Rojo |

- Se aplica en los **botones de la tableta** y en las **gráficas y tablas del panel**, para que cada calificación se reconozca con el mismo color en todos lados.
- La paleta general del prototipo sigue siendo sobria y de fondo blanco.

---

## 3. Resumen para los administradores: cuántos clientes se van satisfechos

El cliente pidió ver, con gráficas, cuántos clientes se van satisfechos. El dato sale **del formulario que llena el cliente** (la calificación). No se piden campos nuevos al cliente.

Se ve **por sucursal** y **por cajero**.

### Ejemplo real

Octubre en Ferreisla, con 100 calificaciones:

- Excelente: 40, Bien: 30, Regular: 15, Mal: 10, Muy mal: 5.
- La gráfica de la sucursal muestra esas barras, cada una con el color de la sección 2.

Octubre, por cajero:

- Mariana López: 60 calificaciones, 36 Excelente y 15 Bien.
- Carlos Vega: 40 calificaciones, 12 Excelente y 10 Bien.
- Se ve de un vistazo quién tiene más clientes contentos y se pueden comparar los turnos.

Se mantiene el filtro de fechas, sucursal y empleado del panel.

---

## 4. Si se cae el internet

El cliente pidió que la tableta funcione **como una página normal** y que, si se cae el internet, **reintente cada cierto tiempo hasta poder enviar**.

- **No** hace falta modo offline completo ni disponibilidad 24/7. Dice que volver a tomar los datos de un cliente no lleva mucho tiempo.
- En el prototipo basta con mostrar el comportamiento: si no hay conexión, aparece un aviso discreto y la calificación queda en espera hasta que se pueda enviar.

### Ejemplo real

El internet de Ferreisla se cae 10 minutos. Un cliente califica «Bien». La tableta le da las gracias igual y guarda la calificación pendiente. Al volver el internet, la envía sola. El cliente no se entera.

---

## 5. Un cuestionario distinto por rol

El cliente pidió que no todos los empleados se evalúen con el mismo cuestionario.

| Rol | En qué se basa su cuestionario |
|---|---|
| Vendedores | Meta de venta |
| Cajeros | Satisfacción del cliente |
| Administrativos | Sin ventas ni clientes |

- Esto **cambia lo que se había decidido** («un formulario de desempeño, sin departamentos»). Ahora el formulario de desempeño depende del **rol del empleado**.
- Siguen aplicando los **formularios dinámicos y versionados**: cada rol tiene su cuestionario y cada uno tiene sus versiones.
- Las preguntas y los puntos de cada cuestionario son **de ejemplo**. Las reales las entrega el cliente.

### Ejemplo real

Al evaluar a Daniel Ortega (vendedor), el gerente ve el cuestionario de vendedores, con una pregunta de meta de venta. Al evaluar a Mariana López (cajera), ve el de cajeros, que usa la satisfacción de los clientes. Al evaluar a una persona administrativa, ve un cuestionario sin ventas ni clientes.

---

## Reglas al implementarlo

- `pnpm`, nunca `npm`. Versiones fijadas.
- Commits sin la línea `Co-Authored-By`.
- Código en inglés; textos de pantalla en español neutro de México.
- Nada de datos reales. Todo lo nuevo se agrega a los datos de ejemplo de `src/mock/` y entra en «Restablecer datos de la demo».
- Al terminar: `pnpm build` y `pnpm test` sin errores, y actualizar el `README.md`.
