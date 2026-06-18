| Función | Descripción | Parámetros |
|---------|-------------|------------|
| `openDB()` | Abre (o crea) la base de datos IndexedDB para persistencia. | Ninguno. Retorna una promesa con la instancia `db`. |
| `saveToDB(key, value)` | Guarda un valor en IndexedDB bajo una clave. | `key` (string): identificador. `value` (any): dato a almacenar. |
| `loadFromDB(key)` | Recupera un valor de IndexedDB. | `key` (string): clave. Retorna promesa con el valor o `null`. |
| `escapeStringForSCM(str, quoteType)` | Escapa caracteres especiales para representar una cadena en formato SCM. | `str` (string): cadena original. `quoteType` (string): tipo de comillas (`'single'`, `'double'`, `'backtick'`). |
| `readU8(bytes, offset)` | Lee un entero sin signo de 8 bits. | `bytes` (Uint8Array), `offset` (number). Retorna número o `null`. |
| `readU16LE(bytes, offset)` | Lee un entero sin signo de 16 bits (little-endian). | `bytes` (Uint8Array), `offset` (number). |
| `readU32LE(bytes, offset)` | Lee un entero sin signo de 32 bits (little-endian). | `bytes` (Uint8Array), `offset` (number). |
| `readI8(bytes, offset)` | Lee un entero con signo de 8 bits. | `bytes` (Uint8Array), `offset` (number). |
| `readI16LE(bytes, offset)` | Lee un entero con signo de 16 bits (little-endian). | `bytes` (Uint8Array), `offset` (number). |
| `readI32LE(bytes, offset)` | Lee un entero con signo de 32 bits (little-endian). | `bytes` (Uint8Array), `offset` (number). |
| `readFloat32LE(bytes, offset)` | Lee un flotante de 32 bits (IEEE 754, little-endian). | `bytes` (Uint8Array), `offset` (number). |
| `labelValueToOffset(rawU32)` | Convierte un valor de puntero de etiqueta (negado) a un offset real. | `rawU32` (number): valor crudo del puntero (32 bits). Retorna offset. |
| `offsetToLabelValue(targetOffset)` | Realiza la conversión inversa: de offset a valor de puntero de etiqueta. | `targetOffset` (number): offset destino. Retorna valor crudo. |
| `parseSASCM(text)` | Parsea el contenido del archivo SASCM.ini y genera una base de datos de definiciones de opcodes. | `text` (string): contenido del INI. Retorna objeto `db` con opcodes. |
| `getDefinition(opNum, db)` | Obtiene la definición de un opcode desde la base de datos, teniendo en cuenta el bit de flag (0x8000). | `opNum` (number): número de opcode. `db` (object): base de datos SASCM. |
| `classifyBytes(bytes, db)` | Algoritmo principal de clasificación de bytes: recorre opcodes y parámetros para asignar estados a cada byte. | `bytes` (Uint8Array): datos binarios. `db` (object): definiciones SASCM. Retorna array de estados. |
| `mark(off, len, st)` (interna) | Marca un rango de bytes con un estado determinado, usado dentro de la clasificación. | `off` (number), `len` (number), `st` (number). |
| `paramSize(tc, b, off)` (interna) | Devuelve el tamaño en bytes de un parámetro según su código de tipo. | `tc` (number): tipo. `b` (Uint8Array), `off` (number). Retorna tamaño. |
| `readParams(opNum, b, off)` (interna) | Lee y analiza todos los parámetros de un opcode desde un offset, calcula destinos y banderas. | `opNum` (number), `b` (Uint8Array), `off` (number). Retorna objeto con `nextOffset`, `targets`, etc. |
| `processAt(off)` (interna) | Procesa un opcode en una posición dada, marca los bytes y determina el comportamiento de flujo (salto, retorno, etc.). | `off` (number): offset. Retorna objeto con análisis o `null`. |
| `markStringBytes(bytes, cls, tc, vo, vs)` | Marca bytes de cadenas dentro del arreglo de clasificación para tipos de string conocidos (09, 0F, 0E). | `bytes` (Uint8Array), `cls` (array), `tc` (tipo), `vo` (inicio del valor), `vs` (tamaño). |
| `detectUnknownStrings(bytes, cls)` | Detecta posibles cadenas en zonas no clasificadas y las marca como `STRING_UNKNOWN` o `POSSIBLE_STRING`. | `bytes` (Uint8Array), `cls` (array de estados). |
| `decompileLinear(bytes, cls, db)` | Descompila los bytes clasificados a líneas de pseudo-código SCM (formato final). | `bytes`, `cls` (array de estados), `db` (definiciones). Retorna array de strings. |
| `applyLabelSuffix(opcode, off)` (interna) | Asigna un sufijo a una etiqueta (ej. `subrutine_`, `table_`) según el opcode, usado en descompilación. | `opcode` (number), `off` (number). |
| `getLabel(off)` (interna) | Genera o devuelve el nombre de etiqueta para un offset dado. | `off` (number). Retorna string. |
| `fmtVal(tc, b, vo, vs, ft, opNum)` (interna) | Convierte un parámetro binario a su representación textual para el descompilado, respetando los formatos (`%p%`, etc.). | `tc` (tipo), `b`, `vo` (inicio), `vs` (tamaño), `ft` (formato), `opNum`. Retorna string. |
| `getVariableKeyAtOffset(offset)` | Obtiene una clave única (var_…, array_…) para la variable o array presente en un offset. | `offset` (number). Retorna string o `null`. |
| `collectAllVariableOccurrences(varKey)` | Busca todas las ocurrencias de una variable/array en todo el binario y devuelve los índices de bytes implicados. | `varKey` (string): clave obtenida con `getVariableKeyAtOffset`. Retorna Set de índices. |
| `drawXRef()` | Dibuja en un canvas especial el resaltado de referencias cruzadas (verde) para la variable/array bajo el cursor. | Ninguno. |
| `setupVirtualHex()` | Configura las dimensiones de los canvas, el espaciador virtual y llama a las funciones de dibujo iniciales. | Ninguno. |
| `drawVisibleHex()` | Renderiza en `hexCanvas` la porción visible del visor hexadecimal (offsets, bytes, ASCII). | Ninguno. |
| `drawSelection()` | Dibuja la capa de selección (azul semitransparente) sobre los bytes seleccionados. | Ninguno. |
| `updateStats(bytes, cls)` | Actualiza la barra de estadísticas con el conteo de bytes por estado de clasificación. | `bytes` (Uint8Array), `cls` (array de estados). |
| `getByteIndexFromEvent(e)` | Convierte la posición del ratón en un evento a un índice de byte dentro del visor. | `e` (MouseEvent). Retorna índice o `null`. |
| `hideHoverHighlights()` | Oculta todos los divs de resalte temporal (hover, opcode pareja, destino). | Ninguno. |
| `getSelectedSortedIndices()` | Devuelve un array ordenado con los índices de los bytes seleccionados. | Ninguno. Retorna `number[]`. |
| `copySelection()` | Copia al portapapeles los bytes seleccionados (o todo el binario si no hay selección) en formato hexadecimal. | Ninguno. |
| `handleContextMenu(e)` | Muestra el menú contextual (copiar hex con/sin espacios, copiar texto) en la posición del ratón. | `e` (MouseEvent). |
| `hideContextMenu()` | Oculta el menú contextual. | Ninguno. |
| `handleLabelDoubleClick(e)` | Al hacer doble clic sobre un puntero de etiqueta, desplaza la vista al offset destino y lo resalta brevemente. | `e` (MouseEvent). |
| `fmtValBasic(tc, off, vs)` | Versión simplificada de `fmtVal`, usada para tooltips (no conoce definiciones de formato avanzadas). | `tc` (tipo), `off` (inicio), `vs` (tamaño). Retorna string. |
| `getValueInfo(offset)` | Obtiene la información textual y de destino (para tooltip) de un byte, incluyendo opcodes, valores, strings, etc. | `offset` (number). Retorna objeto con `text` y opcional `targetOffset` o `null`. |
| `startAutoScroll(direction)` | Inicia un intervalo que desplaza automáticamente el visor mientras se selecciona con el ratón cerca de los bordes. | `direction` (string): `'up'` o `'down'`. |
| `stopAutoScroll()` | Detiene el auto-scroll. | Ninguno. |
| `setupInteraction()` | Configura todos los event listeners del visor (mousedown, mousemove, mouseup, scroll, menú contextual, doble clic). | Ninguno. |
| `loadBytes(b)` | Carga un array de bytes como nuevo binario, reinicia la clasificación y la selección, actualiza el visor y guarda en IndexedDB. | `b` (ArrayBuffer o similar): datos crudos. |
| `saveSascmToDB()` | Guarda el texto actual del editor SASCM.ini en IndexedDB. | Ninguno. |
| `runDecompile()` | Ejecuta el proceso completo de descompilado: clasifica, descompila, detecta strings desconocidos y muestra la salida. | Ninguno. |
| `applyConfigSilent()` | Parsea el editor SASCM.ini y combina las definiciones con los opcodes de flujo obligatorios. | Ninguno. Modifica `sascmDB`. |
| `applyConfig()` (global) | Aplica la configuración (llama a `applyConfigSilent`), guarda en DB y muestra alerta. | Ninguno. |
| `toggleConfig()` (global) | Abre/cierra el panel de configuración SASCM.ini. | Ninguno. |
| `copyOutput()` (global) | Copia el contenido del área de texto del código descompilado al portapapeles. | Ninguno. |
| `showHexModal()` (global) | Muestra el modal para pegar hexadecimal. | Ninguno. |
| `loadHexFromModal()` (global) | Convierte el texto hexadecimal del modal en bytes y los carga en el visor. | Ninguno. |
| `initApp()` | Función principal de inicialización: abre la BD, carga configuración y binario guardados, configura interacción y valores por defecto. | Ninguno. |