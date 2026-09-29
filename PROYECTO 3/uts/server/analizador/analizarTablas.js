// analizarTablas.js
const fs = require("fs");
const JSZip = require("jszip");
const levenshtein = require("fast-levenshtein");

// 🔥 TIPOS DE LEYENDA DE TABLA PERMITIDOS
const TIPOS_TABLA = ["Tabla", "Cuadro"];

// 🔥 FUNCIÓN: Extraer texto limpio de un párrafo
function extraerTextoParrafo(parrafo) {
    const textos = [...parrafo.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
        .map(t => t[1])
        .join("");
    return textos.trim();
}

// 🔥 FUNCIÓN: Verificar si un bloque contiene una tabla
function bloqueTieneTabla(bloque) {
    if (/<w:tbl\b/.test(bloque)) return true;
    return false;
}

// 🔥 FUNCIÓN: Detectar si un texto es un título de tabla válido
// Acepta formatos: "Tabla 1: Descripción", "Cuadro 2. Descripción", "1. Descripción", "1) Descripción"
function esTituloTablaValido(texto) {
    if (!texto) return { valido: false };
    
    const textoLimpio = texto.trim();
    if (textoLimpio.length === 0 || textoLimpio.length > 200) {
        return { valido: false };
    }
    
    const tiposRegex = TIPOS_TABLA.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    // 🔥 PATRÓN 1: Formato clásico "Tabla N: Descripción" o "Cuadro N. Descripción"
    const patronClasico = new RegExp(
        `^(${tiposRegex})\\s+(\\d+(?:\\.\\d+)*)\\s*[:.\\-–—]?\\s*(.*)$`,
        'i'
    );
    
    const matchClasico = textoLimpio.match(patronClasico);
    if (matchClasico) {
        return {
            valido: true,
            tipo: matchClasico[1],
            numero: matchClasico[2],
            descripcion: matchClasico[3] || "",
            textoCompleto: textoLimpio,
            formato: "clasico"
        };
    }
    
    // 🔥 PATRÓN 2: Formato alternativo "N. Descripción" o "N) Descripción" o "N - Descripción"
    // Acepta números como "1", "2", "3.1", "3.1.2", etc.
    const patronAlternativo = /^(\d+(?:\.\d+)*)\s*[.):\-–—]\s*(.+)$/;
    const matchAlternativo = textoLimpio.match(patronAlternativo);
    
    if (matchAlternativo) {
        const descripcion = matchAlternativo[2].trim();
        // 🔥 Validar que la descripción tenga al menos 2 caracteres (para evitar aceptar cosas raras)
        if (descripcion.length >= 2) {
            return {
                valido: true,
                tipo: "Tabla", // Asumimos "Tabla" por defecto
                numero: matchAlternativo[1],
                descripcion: descripcion,
                textoCompleto: textoLimpio,
                formato: "alternativo"
            };
        }
    }
    
    // 🔥 PATRÓN 3: Detectar ortografía incorrecta SOLO si la primera palabra se parece a "Tabla" o "Cuadro"
    const primerPalabra = textoLimpio.split(/\s+/)[0];
    for (const tipo of TIPOS_TABLA) {
        const distancia = levenshtein.get(primerPalabra.toLowerCase(), tipo.toLowerCase());
        if (distancia <= 2 && primerPalabra.toLowerCase() !== tipo.toLowerCase()) {
            return {
                valido: false,
                tipoSugerido: tipo,
                textoOriginal: textoLimpio,
                errorOrtografia: true
            };
        }
    }
    
    return { valido: false };
}

// 🔥 FUNCIÓN: Detectar si un texto es una cita bibliográfica
// 🔥 ESTRICTA: Solo acepta textos con formato de fuente/leyenda de tabla
function esCitaBibliografica(texto) {
    if (!texto) return false;
    
    const textoLimpio = texto.trim();
    if (textoLimpio.length === 0) return false;
    
    // 🔥 PATRONES QUE INDICAN QUE ES UNA CITA/LEYENDA DE TABLA
    const patrones = [
        /^fuente\s*[:.]/i,               // "Fuente:" o "Fuente."
        /^nota\s*[:.]/i,                 // "Nota:"
        /^referencia\s*[:.]/i,           // "Referencia:"
        /^cita\s*[:.]/i,                 // "Cita:"
        /^elaboraci[oó]n\s+propia/i,     // "Elaboración propia"
        /^adaptado\s+de/i,               // "Adaptado de..."
        /^tomado\s+de/i,                 // "Tomado de..."
        /^recuperado\s+de/i,             // "Recuperado de..."
        /^obtenido\s+de/i,               // "Obtenido de..."
        /\(\d{4}\)/,                     // "(2020)"
        /\(\d{4}\s*,\s*\w+\)/,           // "(2020, enero)"
        /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+\s*\(/,  // "Autor ("
        // 🔥 NUEVO: Formato numerado "1. texto", "2. fuente", "3) Nota", "4 - algo"
        /^\d+(?:\.\d+)*\s*[.):\-–—]\s*\S+/  // "1. hola", "2. fuente", "3) x", "4 - y"
    ];
    
    return patrones.some(p => p.test(textoLimpio));
}

// 🔥 FUNCIÓN PRINCIPAL
async function analizarTablas(rutaArchivo) {
    console.log("🔥 ANALIZARTABLAS.JS SE ESTÁ EJECUTANDO 🔥");
    
    try {
        const buffer = fs.readFileSync(rutaArchivo);
        const zip = await JSZip.loadAsync(buffer);
        
        const documentXml = await zip.file("word/document.xml").async("string");
        
        if (!documentXml) {
            return { correcto: false, mensaje: "No se pudo leer document.xml" };
        }
        
        let correctos = [];
        let errores = [];
        
        // 🔥 DIAGNÓSTICO
        const tablasEnXml = documentXml.match(/<w:tbl\b/g);
        console.log(`\n🔍🔍🔍 DIAGNÓSTICO TABLAS 🔍🔍🔍`);
        console.log(`📊 Tags <w:tbl> encontrados: ${tablasEnXml ? tablasEnXml.length : 0}`);
        
                // 🔥 CAPTURAR BLOQUES EN ORDEN CORRECTO: Primero tablas (no anidadas), luego párrafos sueltos
        // Estrategia: recorrer el XML con un regex global que capture en orden
        const bloques = [];
        let indiceGlobal = 0;
        
        // 🔥 Regex que captura tablas O párrafos, en el orden en que aparecen
        // Usamos matchAll para preservar el orden del documento
        const regexBloques = /<w:tbl\b[\s\S]*?<\/w:tbl>|<w:p\b[\s\S]*?<\/w:p>/g;
        const matches = [...documentXml.matchAll(regexBloques)];
        
        for (const match of matches) {
            const bloqueXml = match[0];
            
            // 🔥 IGNORAR párrafos que están DENTRO de una tabla
            // Un párrafo está dentro de una tabla si el match anterior (tabla) lo contiene
            // Solución: verificar si el bloque actual está contenido en el último bloque tabla agregado
            
            if (bloqueXml.startsWith('<w:tbl')) {
                bloques.push({
                    xml: bloqueXml,
                    tipo: 'tabla',
                    indice: indiceGlobal++,
                    texto: extraerTextoParrafo(bloqueXml),
                    tieneTabla: true
                });
            } else if (bloqueXml.startsWith('<w:p ') || bloqueXml.startsWith('<w:p>')) {
                // 🔥 Solo agregar párrafos que NO estén dentro de una tabla
                // Verificar si este párrafo está contenido en alguna tabla ya agregada
                let estaDentroDeTabla = false;
                for (const b of bloques) {
                    if (b.tipo === 'tabla' && b.xml.includes(bloqueXml)) {
                        estaDentroDeTabla = true;
                        break;
                    }
                }
                
                if (!estaDentroDeTabla) {
                    bloques.push({
                        xml: bloqueXml,
                        tipo: 'parrafo',
                        indice: indiceGlobal++,
                        texto: extraerTextoParrafo(bloqueXml),
                        tieneTabla: false
                    });
                }
            }
        }
        
        console.log(`📦 Bloques finales (sin párrafos internos de tabla): ${bloques.length}`);
        console.log(`📊 Tablas reales: ${bloques.filter(b => b.tipo === 'tabla').length}`);
        console.log(`📄 Párrafos sueltos: ${bloques.filter(b => b.tipo === 'parrafo').length}`);
        
        // 🔥 VERIFICAR SI SE CAPTURARON TABLAS
              const tablasCapturadas = bloques.filter(b => b.tipo === 'tabla').length;
        console.log(`📊 Bloques de tabla capturados: ${tablasCapturadas}`);
        console.log(`📄 Total de bloques analizados: ${bloques.length}`);
        
        // 🔥 DETALLE DE CADA BLOQUE TIPO TABLA
        bloques.forEach((b, i) => {
            if (b.tipo === 'tabla') {
                console.log(`   📍 Bloque ${i}: TABLA (${b.xml.length} caracteres)`);
                console.log(`      Texto: "${b.texto.substring(0, 80)}"`);
            }
        });
        console.log(`🔍🔍🔍 FIN DIAGNÓSTICO 🔍🔍🔍\n`);
        
        // 🔥 CONTAR TABLAS
        let totalTablas = 0;
        let tablasConTitulo = 0;
        let tablasSinTitulo = 0;
        let tablasConCita = 0;
        let tablasSinCita = 0;
        
        // 🔥 RECORRER BLOQUES BUSCANDO TABLAS
        for (let i = 0; i < bloques.length; i++) {
            const bloque = bloques[i];
            
            if (bloque.tipo !== 'tabla') continue;
            
            totalTablas++;
            
            console.log(`\n📊 TABLA DETECTADA en bloque ${i}`);
            
            // ==========================================
            // 🔥 1. VALIDAR TÍTULO ARRIBA DE LA TABLA
            // ==========================================
            let tituloEncontrado = null;
            let indiceTitulo = -1;
            
                        // 🔥 Buscar en los bloques ANTERIORES SOLO si están INMEDIATAMENTE pegados a la tabla
            // Permitir como máximo 1 bloque vacío entre el título y la tabla
            let saltosVaciosPermitidos = 1;
            let bloquesVaciosSeguidos = 0;
            
            for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
                const anterior = bloques[j];
                
                // Si el anterior es otra tabla, detener
                if (anterior.tipo === 'tabla') {
                    console.log(`   ⚠️ Se encontró otra tabla arriba, no hay título para esta tabla`);
                    break;
                }
                
                // Si está vacío, contar y continuar SOLO si no se excedió el límite
                if (!anterior.texto || anterior.texto.length === 0) {
                    bloquesVaciosSeguidos++;
                    if (bloquesVaciosSeguidos > saltosVaciosPermitidos) {
                        console.log(`   ⚠️ Demasiados bloques vacíos arriba, no hay título inmediato`);
                        break;
                    }
                    continue;
                }
                
                // 🔥 Si tiene texto, verificar si es título de tabla
                const resultado = esTituloTablaValido(anterior.texto);
                
                if (resultado.valido) {
                    tituloEncontrado = resultado;
                    indiceTitulo = j;
                    console.log(`   ✅ Título encontrado arriba: "${resultado.textoCompleto}"`);
                } else if (resultado.tipoSugerido) {
                    tituloEncontrado = {
                        ...resultado,
                        esError: true,
                        indiceParrafo: j
                    };
                    indiceTitulo = j;
                } else {
                    // 🔥 Si el texto NO es título válido, ESTE bloque no es título.
                    // PERO puede ser la cita de la tabla anterior, así que NO robamos su texto.
                    console.log(`   ⚠️ El bloque anterior "${anterior.texto.substring(0, 30)}" NO es título de tabla`);
                }
                // 🔥 Detener SIEMPRE al encontrar el primer bloque con texto
                break;
            }
            
                       // ==========================================
            // 🔥 2. VALIDAR CITA DEBAJO DE LA TABLA
            // ==========================================
            let citaEncontrada = null;
            let indiceCita = -1;
            
                       // 🔥 Buscar SOLO en los bloques SIGUIENTES si están INMEDIATAMENTE pegados a la tabla
            // Permitir como máximo 1 bloque vacío entre la tabla y la cita
            let saltosVaciosPermitidosCita = 1;
            let bloquesVaciosSeguidosCita = 0;
            
            for (let j = i + 1; j < Math.min(i + 4, bloques.length); j++) {
                const siguiente = bloques[j];
                
                // Si el siguiente es otra tabla, detener la búsqueda
                if (siguiente.tipo === 'tabla') {
                    console.log(`   ⚠️ Se encontró otra tabla abajo, no hay cita para esta tabla`);
                    break;
                }
                
                // Si está vacío, contar y continuar SOLO si no se excedió el límite
                if (!siguiente.texto || siguiente.texto.length === 0) {
                    bloquesVaciosSeguidosCita++;
                    if (bloquesVaciosSeguidosCita > saltosVaciosPermitidosCita) {
                        console.log(`   ⚠️ Demasiados bloques vacíos abajo, no hay cita inmediata`);
                        break;
                    }
                    continue;
                }
                
                // 🔥 Si tiene texto, verificar si es cita bibliográfica
                if (esCitaBibliografica(siguiente.texto)) {
                    citaEncontrada = siguiente.texto;
                    indiceCita = j;
                    console.log(`   ✅ Cita encontrada abajo: "${siguiente.texto.substring(0, 60)}..."`);
                } else {
                    console.log(`   ❌ El bloque ${j} NO es cita bibliográfica: "${siguiente.texto.substring(0, 40)}..."`);
                }
                // 🔥 Detener en el PRIMER bloque con texto (no seguir buscando)
                break;
            }
            
            // ==========================================
            // 🔥 3. EVALUAR RESULTADOS
            // ==========================================
            
            // Validar título
            if (tituloEncontrado) {
                if (tituloEncontrado.esError) {
                    errores.push({
                        tipo: "tabla_titulo_error",
                        buscar: tituloEncontrado.textoOriginal,
                        indiceParrafo: tituloEncontrado.indiceParrafo,
                        indiceTabla: i,
                        mensaje: `El título de la tabla está mal escrito: "${tituloEncontrado.textoOriginal}". Debe escribirse como "${tituloEncontrado.tipoSugerido} X".`
                    });
                } else {
                    tablasConTitulo++;
                    correctos.push(
                        `✅ La tabla ${totalTablas} tiene título correcto: "${tituloEncontrado.textoCompleto}"`
                    );
                }
            } else {
                tablasSinTitulo++;
                errores.push({
                    tipo: "tabla_sin_titulo",
                    buscar: `tabla_${i}`,
                    indiceTabla: i,
                    indiceParrafo: i,
                    mensaje: `La tabla ${totalTablas} no tiene título arriba. Agregue "Tabla X: Descripción" en el margen superior.`
                });
            }
            
            // Validar cita
            if (citaEncontrada) {
                tablasConCita++;
                correctos.push(
                    `✅ La tabla ${totalTablas} tiene cita bibliográfica: "${citaEncontrada.substring(0, 60)}..."`
                );
            } else {
                tablasSinCita++;
                errores.push({
                    tipo: "tabla_sin_cita",
                    buscar: `tabla_${i}`,
                    indiceTabla: i,
                    indiceParrafo: i,
                    mensaje: `La tabla ${totalTablas} no tiene cita bibliográfica debajo. Agregue "Fuente: ..." o "X. Descripción" en el margen inferior.`
                });
            }
        }
        
        // 🔥 RESUMEN
        console.log("\n📊 RESUMEN DE TABLAS:");
        console.log(`   Total de tablas: ${totalTablas}`);
        console.log(`   Con título: ${tablasConTitulo}`);
        console.log(`   Sin título: ${tablasSinTitulo}`);
        console.log(`   Con cita: ${tablasConCita}`);
        console.log(`   Sin cita: ${tablasSinCita}`);
        
        if (totalTablas === 0) {
            correctos.push("✅ El documento no contiene tablas que requieran título y cita.");
        } else {
            if (tablasSinTitulo === 0 && tablasSinCita === 0) {
                correctos.push(`✅ Todas las tablas (${totalTablas}) tienen título y cita correctamente.`);
            }
        }
        
        return {
            correcto: true,
            totalTablas,
            tablasConTitulo,
            tablasSinTitulo,
            tablasConCita,
            tablasSinCita,
            correctos,
            errores
        };
        
    } catch (error) {
        console.error("❌ Error en analizarTablas:", error.message);
        return {
            correcto: false,
            mensaje: error.message
        };
    }
}

module.exports = analizarTablas;