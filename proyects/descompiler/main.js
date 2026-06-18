(function() {
    // ========== IndexedDB Persistence ==========
    const DB_NAME = "SCMDecompiler";
    const DB_VERSION = 1;
    const STORE_NAME = "appData";
    let db = null;
    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = event => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, {
                        keyPath: "key"
                    });
                }
            };
            request.onsuccess = event => {
                db = event.target.result;
                resolve(db);
            };
            request.onerror = event => {
                console.error("IndexedDB error:", event.target.error);
                reject(event.target.error);
            };
        });
    }
    async function saveToDB(key, value) {
        if (!db) await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([ STORE_NAME ], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({
                key: key,
                value: value
            });
            request.onsuccess = () => resolve();
            request.onerror = e => reject(e.target.error);
        });
    }
    async function loadFromDB(key) {
        if (!db) await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([ STORE_NAME ], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => {
                resolve(request.result ? request.result.value : null);
            };
            request.onerror = e => reject(e.target.error);
        });
    }
    // ========== CONSTANTES Y TIPOS ==========
    const TYPE_SIZE = {
        0: 0,
        1: 4,
        2: 2,
        3: 2,
        4: 1,
        5: 2,
        6: 4,
        7: 6,
        8: 6,
        9: 8,
        10: 2,
        11: 2,
        12: 6,
        13: 6,
        14: -1,
        15: 16,
        16: 2,
        17: 2,
        18: 6,
        19: 6
    };
    const STATE_UNKNOWN = 0, STATE_READING = 1, STATE_OPCODE = 2, STATE_TYPE = 3, STATE_VALUE = 4, STATE_NULL = 5;
    const STATE_STRING_OPCODE = 6, STATE_POSSIBLE_STRING = 7, STATE_STRING_UNKNOWN = 8, STATE_FLOAT = 9;
    const STATE_LABEL_POINTER = 10;
    const CLASS_COLORS = {
        [STATE_UNKNOWN]: "transparent",
        [STATE_READING]: "#e6c84c",
        [STATE_OPCODE]: "#4caf84",
        [STATE_TYPE]: "#5b9bd5",
        [STATE_VALUE]: "#b084cc",
        [STATE_NULL]: "#e05555",
        [STATE_STRING_OPCODE]: "#ff69b4",
        [STATE_POSSIBLE_STRING]: "#800000",
        [STATE_STRING_UNKNOWN]: "#ffff00",
        [STATE_FLOAT]: "#ff8c00",
        [STATE_LABEL_POINTER]: "#d0a0ff"
    };
    const CLASS_BG = {
        [STATE_UNKNOWN]: "rgba(58,58,74,0.4)",
        [STATE_READING]: "rgba(230,200,76,0.35)",
        [STATE_OPCODE]: "rgba(76,175,132,0.4)",
        [STATE_TYPE]: "rgba(91,155,213,0.4)",
        [STATE_VALUE]: "rgba(176,132,204,0.4)",
        [STATE_NULL]: "rgba(224,85,85,0.45)",
        [STATE_STRING_OPCODE]: "rgba(255,105,180,0.45)",
        [STATE_POSSIBLE_STRING]: "rgba(128,0,0,0.45)",
        [STATE_STRING_UNKNOWN]: "rgba(255,255,0,0.45)",
        [STATE_FLOAT]: "rgba(255,140,0,0.45)",
        [STATE_LABEL_POINTER]: "rgba(100,100,100,0.7)"
    };
    const ASCII_COLORS = {
        [STATE_UNKNOWN]: "#aaaaaa",
        [STATE_READING]: "#e6c84c",
        [STATE_OPCODE]: "#4caf84",
        [STATE_TYPE]: "#5b9bd5",
        [STATE_VALUE]: "#b084cc",
        [STATE_NULL]: "#e05555",
        [STATE_STRING_OPCODE]: "#ff69b4",
        [STATE_POSSIBLE_STRING]: "#800000",
        [STATE_STRING_UNKNOWN]: "#ffff00",
        [STATE_FLOAT]: "#ff8c00",
        [STATE_LABEL_POINTER]: "#d0a0ff"
    };
    const FLOW_OPCODES = {
        2: "GOTO",
        77: "ELSE_FALSE_JUMP",
        78: "TERMINATE_THIS_SCRIPT",
        79: "START_NEW_SCRIPT",
        80: "GOSUB",
        81: "RETURN",
        215: "START_NEW_SCRIPT_ALT",
        336: "CLEO_CALL",
        337: "CLEO_RETURN",
        1799: "SCENE_SKIP_TO",
        2161: "INIT_JUMP_TABLE",
        2162: "JUMP_TABLE_JUMPS",
        2720: "GOSUB_IF_FALSE",
        2721: "RETURN_IF_FALSE",
        2737: "CLEO_CALL_2",
        2738: "CLEO_RETURN_2",
        3851: "SCRIPT_EVENT_BEFORE",
        3852: "SCRIPT_EVENT_AFTER"
    };
    let rawBytes = null, classification = null, sascmDB = {};
    const OPCODE_LABEL_SUFFIX = {
        80: "subrutine_",
        2720: "subrutine_",
        2737: "function_",
        77: "else_",
        3536: "buffer_",
        2758: "buffer_",
        2161: "table_",
        2162: "table_",
        3695: "script_",
        79: "script_"
    };
    const BYTES_PER_ROW = 16, CELL_W = 24, CELL_H = 20, OFFSET_W = 70;
    const ASCII_CELL_W = 10, HEX_ASCII_GAP = 10;
    const hexContainer = document.getElementById("hexContainer");
    const hexScrollArea = document.getElementById("hexScrollArea");
    const hexSpacer = document.getElementById("hexSpacer");
    const hexCanvas = document.getElementById("hexCanvas");
    const selectionCanvas = document.getElementById("selectionCanvas");
    const ctx = hexCanvas.getContext("2d");
    const selCtx = selectionCanvas.getContext("2d");
    // Canvas para referencias cruzadas (se crea dinámicamente)
    let xrefCanvas = null;
    let xrefCtx = null;
    const hexHighlight = document.createElement("div");
    hexHighlight.className = "hex-highlight";
    hexScrollArea.appendChild(hexHighlight);
    const asciiHighlight = document.createElement("div");
    asciiHighlight.className = "hex-highlight";
    hexScrollArea.appendChild(asciiHighlight);
    const opcodePairHighlight = document.createElement("div");
    opcodePairHighlight.className = "hex-highlight";
    opcodePairHighlight.style.background = "rgba(76,175,132,0.5)";
    hexScrollArea.appendChild(opcodePairHighlight);
    const targetFlash = document.createElement("div");
    targetFlash.className = "target-flash";
    hexScrollArea.appendChild(targetFlash);
    const targetHoverHighlight = document.createElement("div");
    targetHoverHighlight.className = "target-hover";
    hexScrollArea.appendChild(targetHoverHighlight);
    let selectedIndices = new Set();
    let isSelecting = false, selectionAnchor = null, selectionStartIdx = null;
    let selectionMode = "replace", selectionBaseSet = new Set();
    let autoScrollInterval = null;
    // Referencias cruzadas activas
    let xrefIndices = new Set();
    const ctxMenu = document.getElementById("ctxMenu");
    let ctxMenuTarget = null;
    // ========== FUNCIONES DE ESCAPE DE CADENAS ==========
    function escapeStringForSCM(str, quoteType) {
        let out = "";
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            if (ch === 92) {
                // backslash
                out += "\\\\";
            } else if (quoteType === "single" && ch === 39) {
                // '
                out += "\\'";
            } else if (quoteType === "double" && ch === 34) {
                // "
                out += '\\"';
            } else if (quoteType === "backtick" && ch === 96) {
                // `
                out += "\\`";
            } else if (ch === 10) {
                // newline
                out += "\\n";
            } else if (ch === 13) {
                // carriage return
                out += "\\r";
            } else if (ch === 9) {
                // tab
                out += "\\t";
            } else if (ch === 0) {
                // null
                out += "\\0";
            } else if (ch < 32 || ch === 127 || ch >= 128 && ch <= 255) {
                out += "\\x" + ch.toString(16).padStart(2, "0").toUpperCase();
            } else {
                out += str.charAt(i);
            }
        }
        return out;
    }
    // ============================================================
    // UTILIDADES DE LECTURA BINARIA
    // ============================================================
    function readU8(bytes, offset) {
        if (offset >= bytes.length) return null;
        return bytes[offset];
    }
    function readU16LE(bytes, offset) {
        if (offset + 1 >= bytes.length) return null;
        return bytes[offset] | bytes[offset + 1] << 8;
    }
    function readU32LE(bytes, offset) {
        if (offset + 3 >= bytes.length) return null;
        return bytes[offset] | bytes[offset + 1] << 8 | bytes[offset + 2] << 16 | bytes[offset + 3] << 24;
    }
    function readI8(bytes, offset) {
        let v = readU8(bytes, offset);
        if (v === null) return null;
        return v > 127 ? v - 256 : v;
    }
    function readI16LE(bytes, offset) {
        let v = readU16LE(bytes, offset);
        if (v === null) return null;
        return v > 32767 ? v - 65536 : v;
    }
    function readI32LE(bytes, offset) {
        let v = readU32LE(bytes, offset);
        if (v === null) return null;
        return v > 2147483647 ? v - 4294967296 : v;
    }
    function readFloat32LE(bytes, offset) {
        let v = readU32LE(bytes, offset);
        if (v === null) return null;
        let buf = new ArrayBuffer(4);
        let dv = new DataView(buf);
        dv.setUint32(0, v, true);
        return dv.getFloat32(0, true);
    }
    function labelValueToOffset(rawU32) {
        // target = 0xFFFFFFFF - rawU32 + 1
        return (~rawU32 >>> 0) + 1;
    }
    function offsetToLabelValue(targetOffset) {
        let v = targetOffset - 1 >>> 0;
        return ~v >>> 0;
    }
    function parseSASCM(text) {
        let db = {};
        text.split(/\r?\n/).forEach(line => {
            line = line.trim();
            if (!line || line.startsWith(";") || line.startsWith("#") || line.startsWith("[")) return;
            let eq = line.indexOf("=");
            if (eq < 0) return;
            let opc = line.substring(0, eq).trim(), rest = line.substring(eq + 1).trim();
            let comma = rest.indexOf(",");
            if (comma < 0) return;
            let numPar = rest.substring(0, comma).trim(), fmt = rest.substring(comma + 1).trim();
            let opNum = parseInt(opc, 16);
            if (isNaN(opNum)) return;
            let np = parseInt(numPar);
            if (isNaN(np)) np = -1;
            let parts = [], re = /%(\d+)([bdpomgxsh])%/g, m;
            while ((m = re.exec(fmt)) !== null) parts.push({
                paramNum: parseInt(m[1]),
                type: m[2]
            });
            db[opNum] = {
                numParams: np,
                formatStr: fmt,
                formatParts: parts
            };
        });
        return db;
    }
    function getDefinition(opNum, db) {
        if (db[opNum]) return db[opNum];
        if (opNum & 32768) return db[opNum & 32767] || null;
        return null;
    }
    // ========== CLASIFICACIÓN CORREGIDA ==========
    function classifyBytes(bytes, db) {
        let cls = new Array(bytes.length).fill(0), visited = new Set(), queue = [ {
            offset: 0
        } ], maxIter = bytes.length * 4, iter = 0;
        function mark(off, len, st) {
            for (let i = off; i < off + len && i < cls.length; i++) if (cls[i] === 0 || st === 1) cls[i] = st;
        }
        function paramSize(tc, b, off) {
            if (tc === 14) return off >= b.length ? 1 : 1 + b[off];
            let sz = TYPE_SIZE[tc];
            return sz !== undefined && sz >= 0 ? sz : 0;
        }
        function readParams(opNum, b, off) {
            let res = {
                nextOffset: off,
                targets: [],
                isTerm: false,
                isUncond: false,
                isBranch: false
            };
            let def = getDefinition(opNum, db);
            let idx = off;
            if (!def) return res; // sin definición, no avanzar
            if (def.numParams >= 0) {
                for (let i = 0; i < def.numParams; i++) {
                    if (idx >= b.length) break;
                    let tc = b[idx];
                    if (tc === 0) {
                        mark(idx, 1, 5);
                        idx++;
                        break;
                    }
                    mark(idx, 1, 3);
                    idx++;
                    let vs = paramSize(tc, b, idx);
                    if (vs > 0 && idx + vs <= b.length) {
                        let isLabelPtr = false;
                        if (tc === 1 && vs === 4 && def.formatParts) {
                            let fp = def.formatParts.find(p => p.paramNum === i + 1);
                            if (fp && fp.type === "p") isLabelPtr = true;
                        }
                        if (isLabelPtr) {
                            mark(idx, vs, STATE_LABEL_POINTER);
                            let raw = readU32LE(b, idx);
                            if (raw !== null) {
                                let t = labelValueToOffset(raw);
                                if (t >= 0 && t < b.length) res.targets.push({
                                    offset: t
                                });
                            }
                        } else if (tc === 6) {
                            mark(idx, vs, STATE_FLOAT);
                        } else {
                            mark(idx, vs, STATE_VALUE);
                        }
                        idx += vs;
                    } else break;
                }
            } else if (def.numParams === -1) {
                let cnt = 0;
                while (idx < b.length) {
                    let tc = b[idx];
                    if (tc === 0) {
                        mark(idx, 1, 5);
                        idx++;
                        break;
                    }
                    mark(idx, 1, 3);
                    idx++;
                    cnt++;
                    let vs = paramSize(tc, b, idx);
                    if (vs > 0 && idx + vs <= b.length) {
                        let isLabelPtr = false;
                        if (tc === 1 && vs === 4 && def.formatParts) {
                            let fp = def.formatParts.find(p => p.paramNum === cnt);
                            if (fp && fp.type === "p") isLabelPtr = true;
                        }
                        if (isLabelPtr) {
                            mark(idx, vs, STATE_LABEL_POINTER);
                            let raw = readU32LE(b, idx);
                            if (raw !== null) {
                                let t = labelValueToOffset(raw);
                                if (t >= 0 && t < b.length) res.targets.push({
                                    offset: t
                                });
                            }
                        } else if (tc === 6) {
                            mark(idx, vs, STATE_FLOAT);
                        } else {
                            mark(idx, vs, STATE_VALUE);
                        }
                        idx += vs;
                    } else break;
                }
            }
            res.nextOffset = idx;
            return res;
        }
        function processAt(off) {
            if (off + 1 >= bytes.length) return null;
            let op = readU16LE(bytes, off);
            if (op === null) return null;
            let def = getDefinition(op, db);
            // Si no hay definición y no es un opcode de flujo conocido, no procesar
            if (!def && !FLOW_OPCODES[op]) return null;
            mark(off, 2, 2);
            let pr = readParams(op, bytes, off + 2);
            let flow = FLOW_OPCODES[op], isU = false, isT = false, isB = false, tgts = [ ...pr.targets ];
            if (flow === "GOTO") isU = true; else if (flow === "ELSE_FALSE_JUMP") isB = true; else if (flow === "TERMINATE_THIS_SCRIPT") isT = true; else if (flow === "START_NEW_SCRIPT" || flow === "START_NEW_SCRIPT_ALT") tgts.forEach(t => queue.push({
                offset: t.offset
            })); else if (flow === "GOSUB" || flow === "CLEO_CALL" || flow === "CLEO_CALL_2") tgts.forEach(t => queue.push({
                offset: t.offset
            })); else if (flow === "RETURN" || flow === "CLEO_RETURN" || flow === "CLEO_RETURN_2") isT = true; else if (flow === "GOSUB_IF_FALSE") tgts.forEach(t => queue.push({
                offset: t.offset
            })); else if (flow === "SCENE_SKIP_TO" || flow === "SCRIPT_EVENT_BEFORE" || flow === "SCRIPT_EVENT_AFTER") tgts.forEach(t => queue.push({
                offset: t.offset
            })); else if (flow === "INIT_JUMP_TABLE" || flow === "JUMP_TABLE_JUMPS") tgts.forEach(t => queue.push({
                offset: t.offset
            }));
            return {
                nextOffset: pr.nextOffset,
                isU: isU,
                isT: isT,
                isB: isB,
                targets: tgts,
                opNum: op
            };
        }
        while (queue.length && iter < maxIter) {
            iter++;
            let cur = queue.shift().offset;
            if (cur >= bytes.length || visited.has(cur)) continue;
            visited.add(cur);
            let po = cur, pi = 0, mp = bytes.length * 2;
            while (po < bytes.length && pi < mp) {
                pi++;
                if (visited.has(po) && cls[po] !== 0 && cls[po] !== 1) {
                    let eo = readU16LE(bytes, po);
                    if (eo !== null && FLOW_OPCODES[eo] === "ELSE_FALSE_JUMP"); else break;
                }
                let res = processAt(po);
                if (!res) break;
                visited.add(po);
                if (res.isU) {
                    res.targets.forEach(t => {
                        if (!visited.has(t.offset)) queue.push({
                            offset: t.offset
                        });
                    });
                    break;
                }
                if (res.isB) {
                    res.targets.forEach(t => {
                        if (!visited.has(t.offset)) queue.push({
                            offset: t.offset
                        });
                    });
                    po = res.nextOffset;
                    continue;
                }
                if (res.isT) break;
                po = res.nextOffset;
                if (po >= bytes.length) break;
            }
        }
        return cls;
    }
    function markStringBytes(bytes, cls, tc, vo, vs) {
        if (tc === 9) {
            for (let i = vo; i < vo + 7 && i < bytes.length; i++) {
                if (bytes[i] === 0) break;
                cls[i] = STATE_STRING_OPCODE;
            }
        } else if (tc === 15) {
            for (let i = vo; i < vo + 15 && i < bytes.length; i++) {
                if (bytes[i] === 0) break;
                cls[i] = STATE_STRING_OPCODE;
            }
        } else if (tc === 14) {
            let len = bytes[vo];
            for (let i = vo + 1; i < vo + 1 + len && i < bytes.length; i++) {
                cls[i] = STATE_STRING_OPCODE;
            }
        }
    }
    function detectUnknownStrings(bytes, cls) {
        let i = 0;
        while (i < bytes.length) {
            if (cls[i] !== STATE_UNKNOWN) {
                i++;
                continue;
            }
            let start = i;
            while (i < bytes.length && cls[i] === STATE_UNKNOWN) i++;
            let end = i;
            let pos = start;
            while (pos < end) {
                if (cls[pos] !== STATE_UNKNOWN) {
                    pos++;
                    continue;
                }
                if (bytes[pos] >= 32 && bytes[pos] <= 126) {
                    let strStart = pos;
                    let len = 0;
                    while (pos < end && bytes[pos] >= 32 && bytes[pos] <= 126 && len < 255) {
                        len++;
                        pos++;
                    }
                    if (len >= 3) {
                        let isNullTerminated = pos < end && bytes[pos] === 0;
                        if (isNullTerminated) {
                            for (let j = strStart; j < strStart + len; j++) cls[j] = STATE_STRING_UNKNOWN;
                            cls[pos] = STATE_NULL;
                            pos++;
                        } else {
                            for (let j = strStart; j < strStart + len; j++) cls[j] = STATE_POSSIBLE_STRING;
                        }
                    } else {
                        pos = strStart + len;
                    }
                } else {
                    pos++;
                }
            }
        }
    }
    function decompileLinear(bytes, cls, db) {
        let instructions = [], labelNames = {}, labelSuffixes = {};
        let currentLabelPrefix = "Noname";
        function applyLabelSuffix(opcode, off) {
            const baseOp = opcode & 32767;
            const suffix = OPCODE_LABEL_SUFFIX[baseOp];
            if (suffix && !labelSuffixes[off]) {
                labelSuffixes[off] = suffix;
                if (labelNames[off]) labelNames[off] = currentLabelPrefix + "_" + suffix + off.toString(16);
            }
        }
        function getLabel(off) {
            if (labelNames[off]) return labelNames[off];
            let n = labelSuffixes[off] ? currentLabelPrefix + "_" + labelSuffixes[off] + off.toString(16) : currentLabelPrefix + "_" + off.toString(16);
            labelNames[off] = n;
            return n;
        }
        // --- NUEVA FUNCIÓN AUXILIAR: indica si un valor formateado es inválido ---
        function isInvalidParam(val) {
            if (val === undefined || val === null) return true;
            if (val === "?" || val === "@?") return true;
            // Los valores que no pudieron interpretarse y se muestran como hex crudo tampoco son válidos
            if (typeof val === "string" && val.startsWith("0x")) return true;
            return false;
        }
        function fmtVal(tc, b, vo, vs, ft, opNum) {
            if (tc === 1 && vs === 4) {
                let raw = readU32LE(b, vo);
                if (raw === null) return "?";
                if (ft === "p") {
                    let t = labelValueToOffset(raw);
                    if (t >= 0 && t < b.length) {
                        if (opNum !== undefined) applyLabelSuffix(opNum, t);
                        let l = getLabel(t);
                        return "@" + l;
                    }
                    return "@?";
                }
                return String(readI32LE(b, vo));
            }
            if (tc === 4) return String(b[vo] > 127 ? b[vo] - 256 : b[vo]);
            if (tc === 5) return String(readI16LE(b, vo));
            if (tc === 6 && vs === 4) {
                let f = readFloat32LE(b, vo);
                return f !== null ? parseFloat(f.toFixed(6)).toString() : "?";
            }
            if (tc === 2) {
                let v = readU16LE(b, vo);
                if (v % 4 === 0) return "$" + v / 4; else return "&" + v;
            }
            if (tc === 3) return readU16LE(b, vo) + "@";
            if (tc === 10) {
                let v = readU16LE(b, vo);
                if (v % 4 === 0) return "s$" + v / 4; else return "s&" + v;
            }
            if (tc === 11) return readU16LE(b, vo) + "@s";
            if (tc === 16) {
                let v = readU16LE(b, vo);
                if (v % 4 === 0) return "v$" + v / 4; else return "v&" + v;
            }
            if (tc === 17) return readU16LE(b, vo) + "@v";
            if (tc === 9) {
                let s = "";
                for (let i = vo; i < vo + 7 && i < b.length; i++) {
                    if (b[i] === 0) break;
                    s += String.fromCharCode(b[i]);
                }
                markStringBytes(b, cls, tc, vo, vs);
                return "'" + escapeStringForSCM(s, "single") + "'";
            }
            if (tc === 15) {
                let s = "";
                for (let i = vo; i < vo + 15 && i < b.length; i++) {
                    if (b[i] === 0) break;
                    s += String.fromCharCode(b[i]);
                }
                markStringBytes(b, cls, tc, vo, vs);
                return '"' + escapeStringForSCM(s, "double") + '"';
            }
            if (tc === 14) {
                let len = b[vo];
                let s = "";
                for (let i = vo + 1; i < vo + 1 + len && i < b.length; i++) s += String.fromCharCode(b[i]);
                markStringBytes(b, cls, tc, vo, vs);
                return "`" + escapeStringForSCM(s, "backtick") + "`";
            }
            if (tc >= 7 && tc <= 8 || tc === 12 || tc === 13 || tc === 18 || tc === 19) {
                let idxVar = readU16LE(b, vo), offVar = readU16LE(b, vo + 2), size = b[vo + 4], elemType = b[vo + 5];
                let isGlobalOff = (elemType & 128) !== 0, dataType = elemType & 127;
                let suffix = dataType === 0 ? "i" : dataType === 1 ? "f" : dataType === 2 ? "s" : dataType === 3 ? "v" : "?";
                let idxStr, offStr;
                if (tc === 7 || tc === 12 || tc === 18) idxStr = idxVar % 4 === 0 ? "$" + idxVar / 4 : "&" + idxVar; else idxStr = idxVar + "@";
                if (isGlobalOff) offStr = offVar % 4 === 0 ? "$" + offVar / 4 : "&" + offVar; else offStr = offVar + "@";
                if (tc === 12) idxStr = "s" + idxStr.replace(/^s/, "");
                if (tc === 13) idxStr = idxStr + "s";
                if (tc === 18) idxStr = "v" + idxStr.replace(/^v/, "");
                if (tc === 19) idxStr = idxStr + "v";
                return idxStr + "(" + offStr + "," + size + suffix + ")";
            }
            let hex = "";
            for (let i = vo; i < vo + vs && i < b.length; i++) hex += b[i].toString(16).padStart(2, "0").toUpperCase();
            return "0x" + hex;
        }
        let off = 0, proc = new Set();
        while (off < bytes.length) {
            if (proc.has(off)) {
                off++;
                continue;
            }
            let st = cls[off];
            if (st === STATE_OPCODE || st === STATE_READING) {
                let op = readU16LE(bytes, off);
                if (op === null) {
                    off++;
                    continue;
                }
                let def = getDefinition(op, db);
                if (!def) {
                    let start = off;
                    while (off < bytes.length && (cls[off] === STATE_OPCODE || cls[off] === STATE_READING)) {
                        proc.add(off);
                        off++;
                    }
                    instructions.push({
                        offset: start,
                        byteLen: off - start,
                        lines: null,
                        isUnknown: true
                    });
                    continue;
                }
                let idx = off + 2, params = [], len = 2, invalid = false;
                // Leer parámetros según definición
                if (def.numParams >= 0) {
                    for (let i = 0; i < def.numParams; i++) {
                        if (idx >= bytes.length) {
                            invalid = true;
                            break;
                        }
                        let tc = bytes[idx];
                        if (tc === 0) {
                            len++;
                            idx++;
                            // Si se esperaban más parámetros pero apareció un terminador, es inválido
                            if (i + 1 < def.numParams) invalid = true;
                            break;
                        }
                        idx++;
                        len++;
                        let vs = tc === 14 && idx < bytes.length ? 1 + bytes[idx] : TYPE_SIZE[tc];
                        if (vs > 0 && idx + vs <= bytes.length) {
                            let ft = "d";
                            if (def.formatParts) {
                                let fp = def.formatParts.find(p => p.paramNum === i + 1);
                                if (fp) ft = fp.type;
                            }
                            let val = fmtVal(tc, bytes, idx, vs, ft, op);
                            if (isInvalidParam(val)) {
                                invalid = true;
                                // No rompemos aquí para poder calcular len completo y marcarlo como unknown
                            }
                            params.push({
                                val: val,
                                ft: ft
                            });
                            idx += vs;
                            len += vs;
                        } else {
                            invalid = true;
                            break;
                        }
                    }
                    // Si no se leyeron todos los parámetros esperados, también es inválido
                    if (!invalid && params.length < def.numParams) invalid = true;
                } else if (def.numParams === -1) {
                    let cnt = 0;
                    while (idx < bytes.length) {
                        let tc = bytes[idx];
                        if (tc === 0) {
                            len++;
                            idx++;
                            break;
                        }
                        idx++;
                        len++;
                        cnt++;
                        let vs = tc === 14 && idx < bytes.length ? 1 + bytes[idx] : TYPE_SIZE[tc];
                        if (vs > 0 && idx + vs <= bytes.length) {
                            let ft = "d";
                            if (def.formatParts) {
                                let fp = def.formatParts.find(p => p.paramNum === cnt);
                                if (fp) ft = fp.type;
                            }
                            let val = fmtVal(tc, bytes, idx, vs, ft, op);
                            if (isInvalidParam(val)) invalid = true;
                            params.push({
                                val: val,
                                ft: ft
                            });
                            idx += vs;
                            len += vs;
                        } else {
                            invalid = true;
                            break;
                        }
                    }
                }
                // --- Si la instrucción es inválida, se trata como desconocida ---
                if (invalid) {
                    // Marcar todos los bytes implicados como procesados
                    for (let i = off; i < off + len && i < bytes.length; i++) proc.add(i);
                    instructions.push({
                        offset: off,
                        byteLen: len,
                        lines: null,
                        isUnknown: true
                    });
                    off = idx; // avanzamos igual que si se hubiera interpretado bien
                    continue;
                }
                // --- Construir líneas de descompilado (solo si es válida) ---
                let lines = [], opHex = op.toString(16).toUpperCase().padStart(4, "0");
                if (def.formatStr) {
                    let res = def.formatStr.replace(/%(\d+)([bdpomgxsh])%/g, (match, numStr) => {
                        let paramIdx = parseInt(numStr) - 1;
                        return paramIdx >= 0 && paramIdx < params.length ? params[paramIdx].val : "?";
                    });
                    // En este punto no debería haber '?' porque ya validamos, pero por seguridad:
                    if (res.includes("?")) {
                        // Si aun así aparece, forzamos unknown
                        for (let i = off; i < off + len && i < bytes.length; i++) proc.add(i);
                        instructions.push({
                            offset: off,
                            byteLen: len,
                            lines: null,
                            isUnknown: true
                        });
                        off = idx;
                        continue;
                    }
                    if (def.numParams === -1) {
                        const maxPlaceholder = def.formatParts.reduce((max, p) => Math.max(max, p.paramNum), 0);
                        if (params.length > maxPlaceholder) {
                            const extraParams = params.slice(maxPlaceholder).map(p => p.val).join(" ");
                            res += " " + extraParams;
                        }
                    }
                    lines.push(`/* ${off.toString(16)} */ ` + opHex + ": " + res);
                } else {
                    lines.push(`/* ${off.toString(16)} */ ` + opHex + ": " + params.map(p => p.val).join(" "));
                }
                if (op === 932 && params.length > 0) {
                    let rawName = params[0].val.replace(/^['"`]|['"`]$/g, "");
                    let clean = rawName.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
                    if (clean) currentLabelPrefix = clean;
                }
                instructions.push({
                    offset: off,
                    byteLen: len,
                    lines: lines,
                    isUnknown: false
                });
                for (let i = off; i < off + len && i < bytes.length; i++) proc.add(i);
                off = idx;
            } else if (st === STATE_UNKNOWN) {
                let start = off;
                while (off < bytes.length && cls[off] === STATE_UNKNOWN) {
                    proc.add(off);
                    off++;
                }
                instructions.push({
                    offset: start,
                    byteLen: off - start,
                    lines: null,
                    isUnknown: true
                });
            } else {
                proc.add(off);
                off++;
            }
        }
        let finalLines = [], used = new Set();
        for (let inst of instructions) {
            if (!inst.isUnknown) {
                if (labelNames[inst.offset] && !used.has(inst.offset)) {
                    finalLines.push(`/* ${inst.offset.toString(16)} */ :` + labelNames[inst.offset]);
                    used.add(inst.offset);
                }
                for (let l of inst.lines) finalLines.push(l);
            } else {
                let s = inst.offset, e = s + inst.byteLen;
                let inner = Object.keys(labelNames).map(Number).filter(o => o >= s && o < e).sort((a, b) => a - b);
                let cur = s;
                for (let lo of inner) {
                    if (lo > cur) {
                        let unk = [];
                        for (let i = cur; i < lo; i++) unk.push(bytes[i].toString(16).padStart(2, "0").toUpperCase());
                        finalLines.push(`/* ${cur.toString(16)} */ <undefined> ` + unk.join(" ") + " </undefined>");
                    }
                    if (!used.has(lo)) {
                        finalLines.push(`/* ${lo.toString(16)} */ :` + labelNames[lo]);
                        used.add(lo);
                    }
                    cur = lo;
                }
                if (cur < e) {
                    let unk = [];
                    for (let i = cur; i < e; i++) unk.push(bytes[i].toString(16).padStart(2, "0").toUpperCase());
                    finalLines.push(`/* ${cur.toString(16)} */ <undefined> ` + unk.join(" ") + " </undefined>");
                }
            }
        }
        let rem = Object.keys(labelNames).map(Number).filter(o => !used.has(o)).sort((a, b) => a - b);
        for (let o of rem) {
            finalLines.push(`/* ${o.toString(16)} */ :` + labelNames[o]);
        }
        return {
            lines: finalLines,
            instructions: instructions
        };
    }
    // ========== REFERENCIAS CRUZADAS (variables y arrays) ==========
    function getVariableKeyAtOffset(offset) {
        if (!rawBytes || !classification) return null;
        const st = classification[offset];
        if (st !== STATE_TYPE && st !== STATE_VALUE && st !== STATE_FLOAT && st !== STATE_LABEL_POINTER && st !== STATE_STRING_OPCODE && st !== STATE_STRING_UNKNOWN && st !== STATE_NULL) {
            return null;
        }
        // Buscar el STATE_TYPE que inicia este parámetro
        let typeOff = offset;
        while (typeOff > 0 && classification[typeOff] !== STATE_TYPE) typeOff--;
        if (classification[typeOff] !== STATE_TYPE) return null;
        const tc = rawBytes[typeOff];
        // Variables simples
        if (tc === 2 || tc === 3 || tc === 10 || tc === 11 || tc === 16 || tc === 17) {
            if (typeOff + 2 >= rawBytes.length) return null;
            const index = readU16LE(rawBytes, typeOff + 1);
            return `var_${tc.toString(16)}_${index}`;
        }
        // Arrays
        if (tc >= 7 && tc <= 8 || tc === 12 || tc === 13 || tc === 18 || tc === 19) {
            if (typeOff + 2 >= rawBytes.length) return null;
            const idxVar = readU16LE(rawBytes, typeOff + 1);
            return `array_${tc.toString(16)}_${idxVar}`;
        }
        return null;
    }
    function collectAllVariableOccurrences(varKey) {
        if (!varKey || !rawBytes || !classification) return new Set();
        const indices = new Set();
        for (let i = 0; i < classification.length; i++) {
            if (classification[i] !== STATE_TYPE) continue;
            const tc = rawBytes[i];
            let key = null;
            if (tc === 2 || tc === 3 || tc === 10 || tc === 11 || tc === 16 || tc === 17) {
                if (i + 2 < rawBytes.length) {
                    const index = readU16LE(rawBytes, i + 1);
                    key = `var_${tc.toString(16)}_${index}`;
                }
            } else if (tc >= 7 && tc <= 8 || tc === 12 || tc === 13 || tc === 18 || tc === 19) {
                if (i + 2 < rawBytes.length) {
                    const idxVar = readU16LE(rawBytes, i + 1);
                    key = `array_${tc.toString(16)}_${idxVar}`;
                }
            }
            if (key === varKey) {
                const valueLen = tc === 14 ? 1 + rawBytes[i + 1] : TYPE_SIZE[tc] || 0;
                if (valueLen > 0) {
                    for (let j = i; j <= i + valueLen && j < rawBytes.length; j++) {
                        indices.add(j);
                    }
                }
            }
        }
        return indices;
    }
    // La función drawXRef se mantiene como la tienes actualmente
    function drawXRef() {
        if (!xrefCtx || !xrefCanvas) return;
        xrefCtx.clearRect(0, 0, xrefCanvas.width, xrefCanvas.height);
        if (xrefIndices.size === 0 || !rawBytes) return;
        const scrollLeft = hexScrollArea.scrollLeft;
        const scrollTop = hexScrollArea.scrollTop;
        const asciiStartX = OFFSET_W + BYTES_PER_ROW * (CELL_W + 1) + HEX_ASCII_GAP;
        xrefCtx.fillStyle = "rgba(50, 205, 50, 0.45)";
        xrefCtx.strokeStyle = "rgba(50, 205, 50, 0.9)";
        xrefCtx.lineWidth = 1;
        for (let idx of xrefIndices) {
            const row = Math.floor(idx / BYTES_PER_ROW);
            const col = idx % BYTES_PER_ROW;
            const hexX = OFFSET_W + col * (CELL_W + 1) - scrollLeft;
            const hexY = row * CELL_H + 2 - scrollTop;
            xrefCtx.fillRect(hexX, hexY, CELL_W, CELL_H);
            xrefCtx.strokeRect(hexX, hexY, CELL_W, CELL_H);
            const asciiX = asciiStartX + col * ASCII_CELL_W - scrollLeft;
            xrefCtx.fillRect(asciiX, hexY, ASCII_CELL_W, CELL_H);
            xrefCtx.strokeRect(asciiX, hexY, ASCII_CELL_W, CELL_H);
        }
    }
    // ========== VISUALIZACIÓN ==========
    function setupVirtualHex() {
        if (!rawBytes || !rawBytes.length) {
            hexCanvas.width = 0;
            hexCanvas.height = 0;
            selectionCanvas.width = 0;
            selectionCanvas.height = 0;
            if (xrefCanvas) {
                xrefCanvas.width = 0;
                xrefCanvas.height = 0;
            }
            hexSpacer.style.width = "0px";
            hexSpacer.style.height = "0px";
            return;
        }
        const totalRows = Math.ceil(rawBytes.length / BYTES_PER_ROW);
        const hexAreaWidth = OFFSET_W + BYTES_PER_ROW * (CELL_W + 1);
        const asciiAreaWidth = BYTES_PER_ROW * ASCII_CELL_W;
        const totalWidth = hexAreaWidth + HEX_ASCII_GAP + asciiAreaWidth + 20;
        const totalHeight = totalRows * CELL_H + 10;
        hexSpacer.style.width = totalWidth + "px";
        hexSpacer.style.height = totalHeight + "px";
        hexCanvas.width = hexContainer.clientWidth;
        hexCanvas.height = hexContainer.clientHeight;
        hexCanvas.style.width = hexCanvas.width + "px";
        hexCanvas.style.height = hexCanvas.height + "px";
        selectionCanvas.width = hexCanvas.width;
        selectionCanvas.height = hexCanvas.height;
        selectionCanvas.style.width = hexCanvas.style.width;
        selectionCanvas.style.height = hexCanvas.style.height;
        // Crear el canvas de referencias una sola vez, con los mismos estilos que los otros
        if (!xrefCanvas) {
            xrefCanvas = document.createElement("canvas");
            xrefCanvas.id = "xrefCanvas";
            xrefCanvas.style.position = "absolute";
            xrefCanvas.style.top = "0";
            xrefCanvas.style.left = "0";
            xrefCanvas.style.pointerEvents = "none"; // que no bloquee el ratón
            hexContainer.appendChild(xrefCanvas);
            xrefCtx = xrefCanvas.getContext("2d");
        }
        xrefCanvas.width = hexCanvas.width;
        xrefCanvas.height = hexCanvas.height;
        xrefCanvas.style.width = hexCanvas.style.width;
        xrefCanvas.style.height = hexCanvas.style.height;
        drawVisibleHex();
        drawSelection();
        drawXRef();
        if (classification) updateStats(rawBytes, classification);
    }
    function drawVisibleHex() {
        if (!rawBytes || !rawBytes.length) return;
        const scrollLeft = hexScrollArea.scrollLeft;
        const scrollTop = hexScrollArea.scrollTop;
        const viewWidth = hexCanvas.width;
        const viewHeight = hexCanvas.height;
        ctx.clearRect(0, 0, viewWidth, viewHeight);
        const startRow = Math.floor(scrollTop / CELL_H);
        const endRow = Math.min(Math.ceil((scrollTop + viewHeight) / CELL_H), Math.ceil(rawBytes.length / BYTES_PER_ROW));
        const startCol = Math.max(0, Math.floor((scrollLeft - OFFSET_W) / (CELL_W + 1)));
        const endCol = Math.min(BYTES_PER_ROW, Math.ceil((scrollLeft + viewWidth - OFFSET_W) / (CELL_W + 1)));
        const hexAreaWidth = OFFSET_W + BYTES_PER_ROW * (CELL_W + 1);
        const asciiStartX = hexAreaWidth + HEX_ASCII_GAP;
        ctx.font = '11px "Consolas", monospace';
        ctx.textBaseline = "middle";
        for (let row = startRow; row < endRow; row++) {
            const baseY = row * CELL_H + 2;
            const offX = OFFSET_W - scrollLeft;
            const offY = baseY - scrollTop + CELL_H / 2;
            if (offX > 0 && offX < viewWidth) {
                ctx.fillStyle = "#888";
                ctx.textAlign = "right";
                ctx.fillText((row * BYTES_PER_ROW).toString(16).padStart(6, "0"), offX - 8, offY);
            }
            ctx.textAlign = "center";
            for (let col = startCol; col < endCol; col++) {
                const idx = row * BYTES_PER_ROW + col;
                if (idx >= rawBytes.length) break;
                const x = OFFSET_W + col * (CELL_W + 1) - scrollLeft;
                const y = baseY - scrollTop;
                if (x + CELL_W < 0 || x > viewWidth) continue;
                const st = classification ? classification[idx] : STATE_UNKNOWN;
                ctx.fillStyle = CLASS_BG[st];
                ctx.fillRect(x, y, CELL_W, CELL_H);
                if (st === STATE_UNKNOWN) {
                    ctx.strokeStyle = "#555";
                    ctx.setLineDash([ 2, 2 ]);
                    ctx.strokeRect(x, y, CELL_W, CELL_H);
                    ctx.setLineDash([]);
                } else {
                    ctx.strokeStyle = CLASS_COLORS[st];
                    ctx.strokeRect(x, y, CELL_W, CELL_H);
                }
                ctx.fillStyle = st === STATE_UNKNOWN ? "#777" : CLASS_COLORS[st];
                ctx.fillText(rawBytes[idx].toString(16).padStart(2, "0"), x + CELL_W / 2, y + CELL_H / 2);
            }
            const asciiY = baseY - scrollTop + CELL_H / 2;
            ctx.textAlign = "center";
            for (let col = 0; col < BYTES_PER_ROW; col++) {
                const idx = row * BYTES_PER_ROW + col;
                if (idx >= rawBytes.length) break;
                const byte = rawBytes[idx];
                const asciiX = asciiStartX + col * ASCII_CELL_W - scrollLeft;
                if (asciiX + ASCII_CELL_W < 0 || asciiX > viewWidth) continue;
                const ch = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "•";
                const st = classification ? classification[idx] : STATE_UNKNOWN;
                ctx.fillStyle = ASCII_COLORS[st] || "#aaaaaa";
                ctx.fillText(ch, asciiX + ASCII_CELL_W / 2, asciiY);
            }
        }
    }
    function drawSelection() {
        selCtx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
        if (selectedIndices.size === 0 || !rawBytes) return;
        const scrollLeft = hexScrollArea.scrollLeft;
        const scrollTop = hexScrollArea.scrollTop;
        const hexAreaWidth = OFFSET_W + BYTES_PER_ROW * (CELL_W + 1);
        const asciiStartX = hexAreaWidth + HEX_ASCII_GAP;
        selCtx.fillStyle = "rgba(100, 150, 255, 0.35)";
        selCtx.strokeStyle = "rgba(100, 150, 255, 0.8)";
        selCtx.lineWidth = 1;
        for (let idx of selectedIndices) {
            const row = Math.floor(idx / BYTES_PER_ROW);
            const col = idx % BYTES_PER_ROW;
            const hexX = OFFSET_W + col * (CELL_W + 1) - scrollLeft;
            const hexY = row * CELL_H + 2 - scrollTop;
            selCtx.fillRect(hexX, hexY, CELL_W, CELL_H);
            selCtx.strokeRect(hexX, hexY, CELL_W, CELL_H);
            const asciiX = asciiStartX + col * ASCII_CELL_W - scrollLeft;
            selCtx.fillRect(asciiX, hexY, ASCII_CELL_W, CELL_H);
            selCtx.strokeRect(asciiX, hexY, ASCII_CELL_W, CELL_H);
        }
    }
    function updateStats(bytes, cls) {
        let cnts = {};
        for (let i = 0; i <= 10; i++) cnts[i] = 0;
        cls.forEach(v => cnts[v] = (cnts[v] || 0) + 1);
        document.getElementById("statsBar").innerHTML = `
    <span class="stat-badge" style="background:#2a5a2a;color:#8fdf8f">Op:${cnts[STATE_OPCODE]}</span>
    <span class="stat-badge" style="background:#2a2a5a;color:#8f8fdf">Tp:${cnts[STATE_TYPE]}</span>
    <span class="stat-badge" style="background:#3a2a4a;color:#cfafdf">Val:${cnts[STATE_VALUE]}</span>
    <span class="stat-badge" style="background:#4a2a2a;color:#df8f8f">Nul:${cnts[STATE_NULL]}</span>
    <span class="stat-badge" style="background:#4a4a1a;color:#dfdf8f">Rd:${cnts[STATE_READING]}</span>
    <span class="stat-badge" style="background:#3a3a3a;color:#aaa">Unk:${cnts[STATE_UNKNOWN]}</span>
    <span class="stat-badge" style="background:#ff69b4;color:#fff">StrOp:${cnts[STATE_STRING_OPCODE]}</span>
    <span class="stat-badge" style="background:#ffff00;color:#000">StrUnk:${cnts[STATE_STRING_UNKNOWN]}</span>
    <span class="stat-badge" style="background:#800000;color:#fff">Str?:${cnts[STATE_POSSIBLE_STRING]}</span>
    <span class="stat-badge" style="background:#ff8c00;color:#fff">Flt:${cnts[STATE_FLOAT]}</span>
    <span class="stat-badge" style="background:#d0a0ff;color:#000">Lbl:${cnts[STATE_LABEL_POINTER]}</span>`;
    }
    function getByteIndexFromEvent(e) {
        const rect = hexContainer.getBoundingClientRect();
        const mx = e.clientX - rect.left + hexScrollArea.scrollLeft;
        const my = e.clientY - rect.top + hexScrollArea.scrollTop;
        const hexAreaWidth = OFFSET_W + BYTES_PER_ROW * (CELL_W + 1);
        const asciiStartX = hexAreaWidth + HEX_ASCII_GAP;
        const asciiEndX = asciiStartX + BYTES_PER_ROW * ASCII_CELL_W;
        let col = -1, row = -1;
        if (mx >= OFFSET_W && mx < hexAreaWidth) {
            col = Math.floor((mx - OFFSET_W) / (CELL_W + 1));
            row = Math.floor((my - 2) / CELL_H);
        } else if (mx >= asciiStartX && mx < asciiEndX) {
            col = Math.floor((mx - asciiStartX) / ASCII_CELL_W);
            row = Math.floor((my - 2) / CELL_H);
        }
        if (col >= 0 && col < BYTES_PER_ROW && row >= 0) {
            const idx = row * BYTES_PER_ROW + col;
            if (idx < rawBytes.length) return idx;
        }
        return null;
    }
    function hideHoverHighlights() {
        hexHighlight.style.display = "none";
        asciiHighlight.style.display = "none";
        opcodePairHighlight.style.display = "none";
        targetHoverHighlight.style.display = "none";
    }
    function getSelectedSortedIndices() {
        return Array.from(selectedIndices).sort((a, b) => a - b);
    }
    function copySelection() {
        if (!rawBytes) return;
        if (selectedIndices.size > 0) {
            const sorted = getSelectedSortedIndices();
            const hexStr = sorted.map(idx => rawBytes[idx].toString(16).padStart(2, "0")).join(" ");
            navigator.clipboard.writeText(hexStr).then(() => {
                const btn = document.getElementById("btnCopySelection");
                const orig = btn.textContent;
                btn.textContent = "✅ Copiado";
                setTimeout(() => btn.textContent = orig, 1500);
            });
        } else {
            const hexStr = Array.from(rawBytes, b => b.toString(16).padStart(2, "0")).join(" ");
            navigator.clipboard.writeText(hexStr).then(() => {
                const btn = document.getElementById("btnCopySelection");
                const orig = btn.textContent;
                btn.textContent = "✅ Copiado todo";
                setTimeout(() => btn.textContent = orig, 1500);
            });
        }
    }
    function handleContextMenu(e) {
        if (!rawBytes) return;
        if (selectedIndices.size === 0) return;
        e.preventDefault();
        ctxMenu.style.display = "block";
        ctxMenu.style.left = e.clientX + "px";
        ctxMenu.style.top = e.clientY + "px";
        ctxMenuTarget = {
            indices: getSelectedSortedIndices()
        };
    }
    function hideContextMenu() {
        ctxMenu.style.display = "none";
        ctxMenuTarget = null;
    }
    function handleLabelDoubleClick(e) {
        if (!rawBytes || !classification) return;
        const idx = getByteIndexFromEvent(e);
        if (idx === null) return;
        if (classification[idx] !== STATE_LABEL_POINTER) return;
        let start = idx;
        while (start > 0 && classification[start - 1] === STATE_LABEL_POINTER) start--;
        if (start + 3 >= rawBytes.length) return;
        const raw = readU32LE(rawBytes, start);
        if (raw === null) return;
        const targetOffset = labelValueToOffset(raw);
        if (targetOffset < 0 || targetOffset >= rawBytes.length) return;
        const targetRow = Math.floor(targetOffset / BYTES_PER_ROW);
        const targetCol = targetOffset % BYTES_PER_ROW;
        const scrollTop = targetRow * CELL_H - hexContainer.clientHeight / 2 + CELL_H;
        hexScrollArea.scrollTo({
            top: Math.max(0, scrollTop),
            left: 0,
            behavior: "instant"
        });
        const hexX = OFFSET_W + targetCol * (CELL_W + 1);
        const hexY = targetRow * CELL_H + 2;
        targetFlash.style.display = "block";
        targetFlash.style.left = hexX + "px";
        targetFlash.style.top = hexY + "px";
        targetFlash.style.width = CELL_W + "px";
        targetFlash.style.height = CELL_H + "px";
        targetFlash.style.opacity = "1";
        setTimeout(() => {
            targetFlash.style.opacity = "0";
            setTimeout(() => {
                targetFlash.style.display = "none";
            }, 200);
        }, 300);
    }
    // ========== PREVISUALIZACIÓN DE DATOS Y FLECHAS ==========
    function fmtValBasic(tc, off, vs) {
        if (tc === 1 && vs === 4) return String(readI32LE(rawBytes, off));
        if (tc === 4) return String(rawBytes[off] > 127 ? rawBytes[off] - 256 : rawBytes[off]);
        if (tc === 5) return String(readI16LE(rawBytes, off));
        if (tc === 6 && vs === 4) {
            let f = readFloat32LE(rawBytes, off);
            return f !== null ? f.toFixed(6) : "?";
        }
        if (tc === 2) {
            let v = readU16LE(rawBytes, off);
            return v % 4 === 0 ? "$" + v / 4 : "&" + v;
        }
        if (tc === 3) return readU16LE(rawBytes, off) + "@";
        if (tc === 10) {
            let v = readU16LE(rawBytes, off);
            return v % 4 === 0 ? "s$" + v / 4 : "s&" + v;
        }
        if (tc === 11) return readU16LE(rawBytes, off) + "@s";
        if (tc === 16) {
            let v = readU16LE(rawBytes, off);
            return v % 4 === 0 ? "v$" + v / 4 : "v&" + v;
        }
        if (tc === 17) return readU16LE(rawBytes, off) + "@v";
        if (tc === 9) {
            let s = "";
            for (let i = off; i < off + 7 && i < rawBytes.length; i++) {
                if (rawBytes[i] === 0) break;
                s += String.fromCharCode(rawBytes[i]);
            }
            return "'" + escapeStringForSCM(s, "single") + "'";
        }
        if (tc === 15) {
            let s = "";
            for (let i = off; i < off + 15 && i < rawBytes.length; i++) {
                if (rawBytes[i] === 0) break;
                s += String.fromCharCode(rawBytes[i]);
            }
            return '"' + escapeStringForSCM(s, "double") + '"';
        }
        if (tc === 14) {
            let len = rawBytes[off];
            let s = "";
            for (let i = off + 1; i < off + 1 + len && i < rawBytes.length; i++) s += String.fromCharCode(rawBytes[i]);
            return "`" + escapeStringForSCM(s, "backtick") + "`";
        }
        if (tc >= 7 && tc <= 8 || tc === 12 || tc === 13 || tc === 18 || tc === 19) {
            let idxVar = readU16LE(rawBytes, off), offVar = readU16LE(rawBytes, off + 2), size = rawBytes[off + 4], elemType = rawBytes[off + 5];
            let isGlobalOff = (elemType & 128) !== 0, dataType = elemType & 127;
            let suffix = dataType === 0 ? "i" : dataType === 1 ? "f" : dataType === 2 ? "s" : dataType === 3 ? "v" : "?";
            let idxStr, offStr;
            if (tc === 7 || tc === 12 || tc === 18) idxStr = idxVar % 4 === 0 ? "$" + idxVar / 4 : "&" + idxVar; else idxStr = idxVar + "@";
            if (isGlobalOff) offStr = offVar % 4 === 0 ? "$" + offVar / 4 : "&" + offVar; else offStr = offVar + "@";
            if (tc === 12) idxStr = "s" + idxStr.replace(/^s/, "");
            if (tc === 13) idxStr = idxStr + "s";
            if (tc === 18) idxStr = "v" + idxStr.replace(/^v/, "");
            if (tc === 19) idxStr = idxStr + "v";
            return idxStr + "(" + offStr + "," + size + suffix + ")";
        }
        let hex = "";
        for (let i = off; i < off + vs && i < rawBytes.length; i++) hex += rawBytes[i].toString(16).padStart(2, "0").toUpperCase();
        return "0x" + hex;
    }
    function getValueInfo(offset) {
        if (!rawBytes || !classification) return null;
        const st = classification[offset];
        if (st === STATE_OPCODE) {
            let start = offset;
            while (start > 0 && classification[start - 1] === STATE_OPCODE) start--;
            if (start + 1 >= rawBytes.length) return null;
            const op = readU16LE(rawBytes, start);
            if (op === null) return null;
            const def = getDefinition(op, sascmDB);
            const opHex = op.toString(16).toUpperCase().padStart(4, "0");
            let previewLine = "";
            if (def && def.formatStr) {
                let idx = start + 2;
                let params = [];
                if (def.numParams >= 0) {
                    for (let i = 0; i < def.numParams; i++) {
                        if (idx >= rawBytes.length) break;
                        let tc = rawBytes[idx];
                        if (tc === 0) break;
                        idx++;
                        let vs = tc === 14 && idx < rawBytes.length ? 1 + rawBytes[idx] : TYPE_SIZE[tc];
                        if (vs > 0 && idx + vs <= rawBytes.length) {
                            let ft = "d";
                            if (def.formatParts) {
                                let fp = def.formatParts.find(p => p.paramNum === i + 1);
                                if (fp) ft = fp.type;
                            }
                            let valStr = tc === 1 && vs === 4 && ft === "p" ? (() => {
                                let raw = readU32LE(rawBytes, idx);
                                return raw !== null ? "@offset_" + labelValueToOffset(raw) : "?";
                            })() : fmtValBasic(tc, idx, vs);
                            params.push({
                                val: valStr
                            });
                            idx += vs;
                        } else break;
                    }
                } else if (def.numParams === -1) {
                    let cnt = 0;
                    while (idx < rawBytes.length) {
                        let tc = rawBytes[idx];
                        if (tc === 0) break;
                        idx++;
                        cnt++;
                        let vs = tc === 14 && idx < rawBytes.length ? 1 + rawBytes[idx] : TYPE_SIZE[tc];
                        if (vs > 0 && idx + vs <= rawBytes.length) {
                            let ft = "d";
                            if (def.formatParts) {
                                let fp = def.formatParts.find(p => p.paramNum === cnt);
                                if (fp) ft = fp.type;
                            }
                            let valStr = tc === 1 && vs === 4 && ft === "p" ? (() => {
                                let raw = readU32LE(rawBytes, idx);
                                return raw !== null ? "@offset_" + labelValueToOffset(raw) : "?";
                            })() : fmtValBasic(tc, idx, vs);
                            params.push({
                                val: valStr
                            });
                            idx += vs;
                        } else break;
                    }
                }
                previewLine = opHex + ": " + def.formatStr.replace(/%(\d+)([bdpomgxsh])%/g, (match, numStr) => {
                    let i = parseInt(numStr) - 1;
                    return i >= 0 && i < params.length ? params[i].val : "?";
                });
            } else {
                previewLine = opHex + ": <opcode desconocido>";
            }
            return {
                text: previewLine
            };
        } else if (st === STATE_FLOAT) {
            let start = offset;
            while (start > 0 && classification[start - 1] === STATE_FLOAT) start--;
            if (start + 3 >= rawBytes.length) return null;
            let f = readFloat32LE(rawBytes, start);
            return {
                text: f !== null ? f.toFixed(6) : "?"
            };
        } else if (st === STATE_VALUE) {
            let start = offset;
            while (start > 0 && classification[start - 1] === STATE_VALUE) start--;
            if (start === 0) return null;
            let tc = rawBytes[start - 1];
            if (tc === undefined) return null;
            let vs = tc === 14 && start < rawBytes.length ? 1 + rawBytes[start] : TYPE_SIZE[tc];
            if (vs > 0 && start + vs <= rawBytes.length) {
                return {
                    text: fmtValBasic(tc, start, vs)
                };
            }
        } else if (st === STATE_LABEL_POINTER) {
            let start = offset;
            while (start > 0 && classification[start - 1] === STATE_LABEL_POINTER) start--;
            if (start + 3 >= rawBytes.length) return null;
            let raw = readU32LE(rawBytes, start);
            if (raw === null) return null;
            let target = labelValueToOffset(raw);
            let direction = target > start ? "→" : "←";
            let arrowText = `${direction} ${target.toString(16)}`;
            return {
                text: `Offset ${arrowText}`,
                targetOffset: target
            };
        } else if (st === STATE_STRING_OPCODE) {
            // Buscar el type code retrocediendo hasta STATE_TYPE
            let typeOff = offset;
            while (typeOff > 0 && classification[typeOff] !== STATE_TYPE) typeOff--;
            if (classification[typeOff] === STATE_TYPE && typeOff + 1 < rawBytes.length) {
                let tc = rawBytes[typeOff];
                if (tc === 9) {
                    let s = "";
                    for (let i = typeOff + 1; i < typeOff + 8 && i < rawBytes.length; i++) {
                        if (rawBytes[i] === 0) break;
                        s += String.fromCharCode(rawBytes[i]);
                    }
                    return {
                        text: `'${escapeStringForSCM(s, "single")}'`
                    };
                } else if (tc === 15) {
                    let s = "";
                    for (let i = typeOff + 1; i < typeOff + 16 && i < rawBytes.length; i++) {
                        if (rawBytes[i] === 0) break;
                        s += String.fromCharCode(rawBytes[i]);
                    }
                    return {
                        text: `"${escapeStringForSCM(s, "double")}"`
                    };
                } else if (tc === 14) {
                    if (typeOff + 1 >= rawBytes.length) return null;
                    let len = rawBytes[typeOff + 1];
                    let s = "";
                    for (let i = typeOff + 2; i < typeOff + 2 + len && i < rawBytes.length; i++) s += String.fromCharCode(rawBytes[i]);
                    return {
                        text: `\`${escapeStringForSCM(s, "backtick")}\``
                    };
                }
            }
            // Fallback
            let s = "";
            let i = offset;
            while (i < rawBytes.length && rawBytes[i] !== 0) {
                s += String.fromCharCode(rawBytes[i]);
                i++;
            }
            return {
                text: `"${escapeStringForSCM(s, "double")}"`
            };
        } else if (st === STATE_STRING_UNKNOWN) {
            // No hay type code, leer hasta null
            let s = "";
            let i = offset;
            while (i < rawBytes.length && rawBytes[i] !== 0) {
                s += String.fromCharCode(rawBytes[i]);
                i++;
            }
            return {
                text: `"${escapeStringForSCM(s, "double")}"`
            };
        } else if (st === STATE_POSSIBLE_STRING) {
            return null;
        }
        return null;
    }
    function startAutoScroll(direction) {
        if (autoScrollInterval) return;
        autoScrollInterval = setInterval(() => {
            const delta = direction === "up" ? -CELL_H : CELL_H;
            hexScrollArea.scrollBy(0, delta);
        }, 30);
    }
    function stopAutoScroll() {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    }
    function setupInteraction() {
        const tip = document.getElementById("hexTooltip");
        function updateSelectionRange(minIdx, maxIdx) {
            if (selectionMode === "replace") {
                selectedIndices.clear();
                for (let i = minIdx; i <= maxIdx; i++) selectedIndices.add(i);
            } else if (selectionMode === "invert") {
                selectedIndices.clear();
                for (let idx of selectionBaseSet) selectedIndices.add(idx);
                for (let i = minIdx; i <= maxIdx; i++) {
                    if (selectedIndices.has(i)) selectedIndices.delete(i); else selectedIndices.add(i);
                }
            } else if (selectionMode === "extend") {
                selectedIndices.clear();
                for (let idx of selectionBaseSet) selectedIndices.add(idx);
                for (let i = minIdx; i <= maxIdx; i++) selectedIndices.add(i);
            }
            drawSelection();
        }
        hexScrollArea.addEventListener("mousedown", e => {
            if (e.button !== 0) return;
            if (!rawBytes) return;
            const idx = getByteIndexFromEvent(e);
            if (idx === null) return;
            if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (selectionAnchor !== null) {
                    const start = Math.min(selectionAnchor, idx);
                    const end = Math.max(selectionAnchor, idx);
                    for (let i = start; i <= end; i++) selectedIndices.add(i);
                    drawSelection();
                } else {
                    selectionAnchor = idx;
                    selectedIndices.clear();
                    selectedIndices.add(idx);
                    drawSelection();
                }
                isSelecting = false;
                return;
            }
            isSelecting = true;
            if (e.ctrlKey || e.metaKey) {
                selectionMode = "invert";
            } else if (e.shiftKey) {
                selectionMode = "extend";
                if (selectionAnchor === null) selectionAnchor = idx;
            } else {
                selectionMode = "replace";
                selectionAnchor = idx;
            }
            selectionStartIdx = selectionMode === "extend" ? selectionAnchor : idx;
            selectionBaseSet = new Set(selectedIndices);
            const minIdx = Math.min(selectionStartIdx, idx);
            const maxIdx = Math.max(selectionStartIdx, idx);
            updateSelectionRange(minIdx, maxIdx);
            hideHoverHighlights();
            e.preventDefault();
        });
        window.addEventListener("mousemove", e => {
            if (!rawBytes) return;
            const idx = getByteIndexFromEvent(e);
            const rect = hexContainer.getBoundingClientRect();
            const mouseY = e.clientY - rect.top;
            if (isSelecting) {
                if (idx !== null) {
                    const start = selectionStartIdx;
                    const minIdx = Math.min(start, idx);
                    const maxIdx = Math.max(start, idx);
                    updateSelectionRange(minIdx, maxIdx);
                }
                const scrollThreshold = 40;
                if (mouseY < scrollThreshold) startAutoScroll("up"); else if (mouseY > hexContainer.clientHeight - scrollThreshold) startAutoScroll("down"); else stopAutoScroll();
                tip.style.display = "none";
                hideHoverHighlights();
                xrefIndices.clear();
                drawXRef();
                return;
            }
            stopAutoScroll();
            // Resaltado de referencias cruzadas (variables/arrays)
            let varKey = null;
            if (idx !== null) {
                varKey = getVariableKeyAtOffset(idx);
            }
            if (varKey) {
                xrefIndices = collectAllVariableOccurrences(varKey);
            } else {
                xrefIndices.clear();
            }
            drawXRef();
            // Tooltip y resaltes locales (sin cambios)
            const mx = e.clientX - rect.left + hexScrollArea.scrollLeft;
            const my = e.clientY - rect.top + hexScrollArea.scrollTop;
            const hexAreaWidth = OFFSET_W + BYTES_PER_ROW * (CELL_W + 1);
            const asciiStartX = hexAreaWidth + HEX_ASCII_GAP;
            const asciiEndX = asciiStartX + BYTES_PER_ROW * ASCII_CELL_W;
            let col = -1, row = -1;
            if (mx >= OFFSET_W && mx < hexAreaWidth) {
                col = Math.floor((mx - OFFSET_W) / (CELL_W + 1));
                row = Math.floor((my - 2) / CELL_H);
            } else if (mx >= asciiStartX && mx < asciiEndX) {
                col = Math.floor((mx - asciiStartX) / ASCII_CELL_W);
                row = Math.floor((my - 2) / CELL_H);
            }
            if (col >= 0 && col < BYTES_PER_ROW && row >= 0) {
                const idx2 = row * BYTES_PER_ROW + col;
                if (idx2 < rawBytes.length) {
                    const st = classification ? classification[idx2] : 0;
                    const sts = [ "desconocido", "leyendo", "opcode", "type_code", "value", "terminal_null", "string_opcode", "posible_string", "string_unknown", "float", "label_pointer" ];
                    const hex = rawBytes[idx2].toString(16).padStart(2, "0");
                    const ascii = rawBytes[idx2] >= 32 && rawBytes[idx2] < 127 ? String.fromCharCode(rawBytes[idx2]) : ".";
                    let tipText = `Offset:0x${idx2.toString(16).padStart(6, "0")} | ${hex} | ${ascii} | ${sts[st]}`;
                    const extra = getValueInfo(idx2);
                    if (extra && extra.text) tipText += "\n" + extra.text;
                    tip.style.display = "block";
                    tip.style.left = e.clientX + 16 + "px";
                    tip.style.top = e.clientY - 30 + "px";
                    tip.innerHTML = tipText.replace(/\n/g, "<br>");
                    const hexX = OFFSET_W + col * (CELL_W + 1);
                    const hexY = row * CELL_H + 2;
                    hexHighlight.style.display = "block";
                    hexHighlight.style.left = hexX + "px";
                    hexHighlight.style.top = hexY + "px";
                    hexHighlight.style.width = CELL_W + "px";
                    hexHighlight.style.height = CELL_H + "px";
                    const asciiX = asciiStartX + col * ASCII_CELL_W;
                    const asciiY = row * CELL_H + 2;
                    asciiHighlight.style.display = "block";
                    asciiHighlight.style.left = asciiX + "px";
                    asciiHighlight.style.top = asciiY + "px";
                    asciiHighlight.style.width = ASCII_CELL_W + "px";
                    asciiHighlight.style.height = CELL_H + "px";
                    if (classification && classification[idx2] === STATE_OPCODE) {
                        const pairIdx = idx2 % 2 === 0 ? idx2 + 1 : idx2 - 1;
                        if (pairIdx >= 0 && pairIdx < rawBytes.length && classification[pairIdx] === STATE_OPCODE) {
                            const pairCol = pairIdx % BYTES_PER_ROW;
                            const pairRow = Math.floor(pairIdx / BYTES_PER_ROW);
                            const pairHexX = OFFSET_W + pairCol * (CELL_W + 1);
                            const pairHexY = pairRow * CELL_H + 2;
                            opcodePairHighlight.style.display = "block";
                            opcodePairHighlight.style.left = pairHexX + "px";
                            opcodePairHighlight.style.top = pairHexY + "px";
                            opcodePairHighlight.style.width = CELL_W + "px";
                            opcodePairHighlight.style.height = CELL_H + "px";
                        } else {
                            opcodePairHighlight.style.display = "none";
                        }
                    } else {
                        opcodePairHighlight.style.display = "none";
                    }
                    if (extra && extra.targetOffset !== undefined) {
                        const targetOff = extra.targetOffset;
                        const targetRow = Math.floor(targetOff / BYTES_PER_ROW);
                        const targetCol = targetOff % BYTES_PER_ROW;
                        const targetX = OFFSET_W + targetCol * (CELL_W + 1);
                        const targetY = targetRow * CELL_H + 2;
                        targetHoverHighlight.style.display = "block";
                        targetHoverHighlight.style.left = targetX + "px";
                        targetHoverHighlight.style.top = targetY + "px";
                        targetHoverHighlight.style.width = CELL_W + "px";
                        targetHoverHighlight.style.height = CELL_H + "px";
                    } else {
                        targetHoverHighlight.style.display = "none";
                    }
                    return;
                }
            }
            tip.style.display = "none";
            hideHoverHighlights();
        });
        window.addEventListener("mouseup", () => {
            if (isSelecting) {
                isSelecting = false;
                stopAutoScroll();
                drawSelection();
            }
        });
        hexScrollArea.addEventListener("dblclick", handleLabelDoubleClick);
        hexScrollArea.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("click", e => {
            if (!ctxMenu.contains(e.target)) hideContextMenu();
        });
        ctxMenu.querySelectorAll(".ctx-item").forEach(item => {
            item.addEventListener("click", () => {
                if (!ctxMenuTarget || !rawBytes) return;
                const {
                    indices
                } = ctxMenuTarget;
                if (!indices || indices.length === 0) return;
                const bytesSlice = indices.map(i => rawBytes[i]);
                const action = item.dataset.action;
                let text = "";
                if (action === "copyHexSpaces") {
                    text = bytesSlice.map(b => b.toString(16).padStart(2, "0")).join(" ");
                } else if (action === "copyHexNoSpaces") {
                    text = bytesSlice.map(b => b.toString(16).padStart(2, "0")).join("");
                } else if (action === "copyText") {
                    text = String.fromCharCode(...bytesSlice);
                }
                navigator.clipboard.writeText(text).then(() => {});
                hideContextMenu();
            });
        });
        hexScrollArea.addEventListener("scroll", () => {
            hideHoverHighlights();
            drawVisibleHex();
            drawSelection();
            drawXRef();
        });
    }
    window.addEventListener("resize", () => setupVirtualHex());
    function loadBytes(b) {
        rawBytes = new Uint8Array(b);
        classification = new Array(rawBytes.length).fill(0);
        selectedIndices.clear();
        selectionAnchor = null;
        document.getElementById("outputCode").value = "";
        setupVirtualHex();
        saveToDB("binaryData", b.buffer.slice(0)).catch(console.error);
    }
    async function saveSascmToDB() {
        const text = document.getElementById("sascmEditor").value;
        await saveToDB("sascmConfig", text).catch(console.error);
    }
    function runDecompile() {
    if (!rawBytes || !rawBytes.length) {
        alert('Carga un archivo o pega hex.');
        return;
    }
    applyConfigSilent();
    // Clasificación inicial (opcodes, tipos, valores...)
    classification = new Array(rawBytes.length).fill(0);
    classification = classifyBytes(rawBytes, sascmDB);
    
    // Descompilar y obtener instrucciones (también marca strings válidos en cls)
    const result = decompileLinear(rawBytes, classification, sascmDB);
    
    // --- NUEVO ORDEN: primero anulamos los bytes de instrucciones inválidas ---
    if (result.instructions) {
        for (const inst of result.instructions) {
            if (inst.isUnknown) {
                for (let i = inst.offset; i < inst.offset + inst.byteLen && i < classification.length; i++) {
                    classification[i] = STATE_UNKNOWN;
                }
            }
        }
    }
    
    // --- DESPUÉS detectamos cadenas en las zonas que han quedado como UNKNOWN ---
    detectUnknownStrings(rawBytes, classification);
    
    document.getElementById('outputCode').value = result.lines.join('\n');
    setupVirtualHex(); // ahora verás los colores de cadenas en los bloques undefined
}
    function applyConfigSilent() {
        sascmDB = parseSASCM(document.getElementById("sascmEditor").value);
        let defs = {
            2: {
                numParams: 1,
                formatStr: "jump %1p%",
                formatParts: [ {
                    paramNum: 1,
                    type: "p"
                } ]
            },
            77: {
                numParams: 1,
                formatStr: "else_jump %1p%",
                formatParts: [ {
                    paramNum: 1,
                    type: "p"
                } ]
            },
            78: {
                numParams: 0,
                formatStr: "end_thread",
                formatParts: []
            },
            79: {
                numParams: -1,
                formatStr: "start_new_script %1p%",
                formatParts: [ {
                    paramNum: 1,
                    type: "p"
                } ]
            },
            80: {
                numParams: -1,
                formatStr: "gosub %1p%",
                formatParts: [ {
                    paramNum: 1,
                    type: "p"
                } ]
            },
            81: {
                numParams: 0,
                formatStr: "return",
                formatParts: []
            },
            215: {
                numParams: -1,
                formatStr: "start_new_script %1p%",
                formatParts: [ {
                    paramNum: 1,
                    type: "p"
                } ]
            },
            336: {
                numParams: -1,
                formatStr: "cleo_call %1p%",
                formatParts: [ {
                    paramNum: 1,
                    type: "p"
                } ]
            },
            337: {
                numParams: 0,
                formatStr: "cleo_return",
                formatParts: []
            },
            2737: {
                numParams: -1,
                formatStr: "cleo_call %1p%",
                formatParts: [ {
                    paramNum: 1,
                    type: "p"
                } ]
            },
            2738: {
                numParams: -1,
                formatStr: "cleo_return %1d%",
                formatParts: [ {
                    paramNum: 1,
                    type: "d"
                } ]
            },
            2720: {
                numParams: -1,
                formatStr: "gosub_if_false %1p%",
                formatParts: [ {
                    paramNum: 1,
                    type: "p"
                } ]
            },
            2721: {
                numParams: 0,
                formatStr: "return_if_false",
                formatParts: []
            },
            932: {
                numParams: -1,
                formatStr: "thread %1s%",
                formatParts: [ {
                    paramNum: 1,
                    type: "s"
                } ]
            }
        };
        Object.entries(defs).forEach(([ k, v ]) => {
            if (!sascmDB[k]) sascmDB[k] = v;
        });
    }
    window.applyConfig = async function() {
        applyConfigSilent();
        await saveSascmToDB();
        alert("Configuración aplicada y guardada.");
    };
    window.toggleConfig = () => document.getElementById("configPanel").classList.toggle("open");
    window.copyOutput = () => {
        let ta = document.getElementById("outputCode");
        ta.select();
        document.execCommand("copy");
    };
    window.showHexModal = () => new bootstrap.Modal(document.getElementById("hexModal")).show();
    window.loadHexFromModal = () => {
        let hex = document.getElementById("hexTextarea").value.replace(/[^0-9A-Fa-f]/g, "");
        if (hex.length % 2 !== 0) {
            alert("Hex impar.");
            return;
        }
        let bytes = [];
        for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substring(i, i + 2), 16));
        loadBytes(new Uint8Array(bytes));
        bootstrap.Modal.getInstance(document.getElementById("hexModal")).hide();
    };
    window.runDecompile = runDecompile;
    window.copySelection = copySelection;
    document.getElementById("fileInput").addEventListener("change", e => {
        if (e.target.files[0]) {
            let r = new FileReader();
            r.onload = ev => loadBytes(new Uint8Array(ev.target.result));
            r.readAsArrayBuffer(e.target.files[0]);
        }
    });
    document.body.addEventListener("dragover", e => e.preventDefault());
    document.body.addEventListener("drop", e => {
        e.preventDefault();
        if (e.dataTransfer.files[0]) {
            let r = new FileReader();
            r.onload = ev => loadBytes(new Uint8Array(ev.target.result));
            r.readAsArrayBuffer(e.dataTransfer.files[0]);
        }
    });
    async function initApp() {
        await openDB();
        const savedConfig = await loadFromDB("sascmConfig");
        if (savedConfig) {
            document.getElementById("sascmEditor").value = savedConfig;
        } else {
            document.getElementById("sascmEditor").value = `; SASCM.ini
[OPCODES]
0000=0,NOP
0001=1,wait %1d% ms
0002=1,jump %1p%
0003=1,shake_camera %1d%
004D=1,else_jump %1p%
004E=0,terminate_this_script
004F=-1,start_new_script %1p%
0050=-1,gosub %1p%
0051=0,return
009A=6,%6d% = create_actor_type %1d% model %2m% at %3d% %4d% %5d%
00DF=1,actor %1d% driving
03A4=-1,thread %1s%
0AB1=-1,cleo_call %1p%
0AB2=-1,cleo_return %1d%`;
        }
        applyConfigSilent();
        const savedBinary = await loadFromDB("binaryData");
        if (savedBinary) {
            loadBytes(new Uint8Array(savedBinary));
            document.getElementById("outputCode").value = "Load perfect. Decompile your script";
        } else {
            let ex = "00 00 01 00 04 00 02 00 01 FE FF FF FF".replace(/[^0-9A-Fa-f]/g, "");
            let eb = [];
            for (let i = 0; i < ex.length; i += 2) eb.push(parseInt(ex.substring(i, i + 2), 16));
            loadBytes(new Uint8Array(eb));
            document.getElementById("outputCode").value = "Upload any file CLEO.";
        }
        setupInteraction();
    }
    initApp().catch(console.error);
})();