## Estructura de funciones por alcance y módulo lógico

- **IIFE** (función anónima autoejecutable — alcance local al módulo)

  - `openDB() {Promise<IDBDatabase>}` → *(Storage/IndexedDB)* Abre IndexedDB, crea el almacén si no existe.
  - `saveToDB(key: string, value: any) {Promise<void>}` → *(Storage/IndexedDB)* Guarda un valor.
  - `loadFromDB(key: string) {Promise<any>}` → *(Storage/IndexedDB)* Recupera un valor.

  - `getValueState(tc: number) {number}` → *(Clasificación)* Traduce código de tipo a estado.
  - `escapeStringForSCM(str: string, quoteType: string) {string}` → *(Utilidades SCM)* Escapa cadenas para SCM.

  - **Lectura binaria** *(Utilidades de lectura de bytes)*
    - `readU8(bytes: Uint8Array, offset: number) {number|null}`
    - `readU16LE(bytes: Uint8Array, offset: number) {number|null}`
    - `readU32LE(bytes: Uint8Array, offset: number) {number|null}`
    - `readI8(bytes: Uint8Array, offset: number) {number|null}`
    - `readI16LE(bytes: Uint8Array, offset: number) {number|null}`
    - `readI32LE(bytes: Uint8Array, offset: number) {number|null}`
    - `readFloat32LE(bytes: Uint8Array, offset: number) {number|null}`

  - `labelValueToOffset(rawU32: number) {number}` → *(Utilidades SCM)* Convierte puntero de etiqueta a offset.
  - `offsetToLabelValue(targetOffset: number) {number}` → *(Utilidades SCM)* Convierte offset a puntero.
  - `parseSASCM(text: string) {object}` → *(Configuración)* Parsea SASCM.ini.
  - `getDefinition(opNum: number, db: object) {object|null}` → *(Configuración)* Obtiene definición de un opcode.

  - `classifyBytes(bytes: Uint8Array, db: object) {Array<number>}` → *(Clasificación)* Clasifica todos los bytes.
    - **Funciones internas de `classifyBytes`:**
      - `mark(off, len, st)` → *(Clasificación)* Marca un rango con un estado.
      - `paramSize(tc, b, off)` → *(Clasificación)* Calcula tamaño de un parámetro.
      - `readParams(opNum, b, off)` → *(Clasificación)* Lee parámetros de un opcode.
      - `processAt(off)` → *(Clasificación)* Procesa un opcode en una posición.

  - `markStringBytes(bytes, cls, tc, vo, vs) {void}` → *(Clasificación)* Marca bytes de cadenas.
  - `detectUnknownStrings(bytes, cls) {void}` → *(Clasificación)* Encuentra cadenas en zonas desconocidas.

  - `decompileLinear(bytes, cls, db) { {lines, instructions} }` → *(Descompilación)* Descompila linealmente.
    - **Funciones internas de `decompileLinear`:**
      - `applyLabelSuffix(opcode, off)` → *(Descompilación)* Asigna sufijo a etiquetas.
      - `getLabel(off)` → *(Descompilación)* Genera/recupera nombre de etiqueta.
      - `isInvalidParam(val)` → *(Descompilación)* Comprueba si un valor formateado es inválido.
      - `fmtVal(tc, b, vo, vs, ft, opNum)` → *(Descompilación)* Formatea un valor según su tipo.

  - `isValueState(st: number) {boolean}` → *(Clasificación)* ¿Es un estado de valor?
  - `getVariableKeyAtOffset(offset: number) {string|null}` → *(Referencias cruzadas)* Clave de variable/array en offset.
  - `collectAllVariableOccurrences(varKey: string) {Set<number>}` → *(Referencias cruzadas)* Índices de todas las ocurrencias.
  - `drawXRef() {void}` → *(Visualización)* Dibuja referencias cruzadas.

  - `setupVirtualHex() {void}` → *(Visualización)* Redimensiona y redibuja la vista hex.
  - `drawVisibleHex() {void}` → *(Visualización)* Renderiza hex y ASCII.
  - `drawSelection() {void}` → *(Visualización)* Resalta bytes seleccionados.
  - `updateStats(bytes, cls) {void}` → *(Visualización)* Actualiza barra de estadísticas.
  - `getByteIndexFromEvent(e: MouseEvent) {number|null}` → *(Interacción)* Byte bajo el cursor.
  - `hideHoverHighlights() {void}` → *(Interacción)* Oculta resaltes flotantes.
  - `getSelectedSortedIndices() {Array<number>}` → *(Selección)* Índices seleccionados ordenados.
  - `copySelection() {void}` → *(Selección)* Copia selección (o todo) al portapapeles.
  - `handleContextMenu(e: MouseEvent) {void}` → *(Interacción)* Muestra menú contextual.
  - `hideContextMenu() {void}` → *(Interacción)* Oculta menú contextual.
  - `handleLabelDoubleClick(e: MouseEvent) {void}` → *(Interacción)* Salta al offset destino de un puntero.
  - `fmtValBasic(tc, off, vs) {string}` → *(Visualización/Utilidades)* Formatea valor para tooltip.
  - `getValueInfo(offset) { {text, targetOffset?, isError?} | null }` → *(Visualización)* Info detallada para tooltip.
  - `startAutoScroll(direction: string) {void}` → *(Interacción)* Activa desplazamiento automático.
  - `stopAutoScroll() {void}` → *(Interacción)* Detiene el desplazamiento automático.
  - `setupInteraction() {void}` → *(Interacción)* Configura listeners de ratón/teclado.

  - `loadBytes(b: ArrayBuffer|Uint8Array) {void}` → *(Storage)* Carga bytes, reinicia estado y guarda en DB.
  - `saveSascmToDB() {Promise<void>}` → *(Storage)* Guarda editor SASCM.ini en IndexedDB.
  - `runDecompile() {void}` → *(Descompilación)* Ejecuta descompilación completa.
  - `applyConfigSilent() {void}` → *(Configuración)* Aplica configuración sin alertas.
  - `initApp() {Promise<void>}` → *(Inicialización)* Inicializa la aplicación.
  - `resolveUndefinedLabels(code: string, prefix: string) {string}` → *(Descompilación)* Corrige referencias a etiquetas no definidas.

  - **Exportaciones al objeto global `window`** *(alcance global / API pública)*
    - `window.applyConfig` → *(Configuración)* Aplica y guarda configuración, muestra alerta.
    - `window.toggleConfig` → *(UI)* Muestra/oculta panel de configuración.
    - `window.copyOutput` → *(UI)* Copia el código descompilado.
    - `window.showHexModal` → *(UI)* Abre modal para pegar hex.
    - `window.loadHexFromModal` → *(UI)* Carga bytes desde el modal.
    - `window.runDecompile` → *(Descompilación)* Alias público de `runDecompile`.
    - `window.copySelection` → *(Selección)* Alias público de `copySelection`.