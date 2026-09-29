const fs = require("fs");
const JSZip = require("jszip");

// 🔥 FUNCIÓN DE LIMPIEZA PARA MENSAJES - NUNCA mostrar XML en comentarios
function limpiarTextoParaMensaje(texto) {
    if (!texto) return '';
    // Eliminar cualquier etiqueta XML que se haya colado
    let limpio = texto.replace(/<[^>]+>/g, '');
    // Eliminar saltos de línea y espacios múltiples
    limpio = limpio.replace(/[\r\n\t]+/g, ' ');
    limpio = limpio.replace(/\s+/g, ' ');
    return limpio.trim();
}

// 🔥 FUNCIÓN PARA VERIFICAR SALTO DE PÁGINA (solo para títulos principales)
function haySaltoDePaginaEntre(parrafosConTexto, idx1, idx2) {
    if (idx1 > idx2) [idx1, idx2] = [idx2, idx1];
    
    for (let i = idx1; i <= idx2; i++) {
        const parrafo = parrafosConTexto[i];
        if (!parrafo) continue;
        
        const tieneSalto = 
            parrafo.parrafo.includes('w:br w:type="page"') || 
            parrafo.parrafo.includes('w:pageBreak') ||
            parrafo.parrafo.includes('<w:lastRenderedPageBreak') ||
            parrafo.parrafo.includes('w:pageBreakBefore') ||
            parrafo.parrafo.includes('w:pageBreak w:type="page"');
        
        if (tieneSalto) {
            console.log(`   🔥 Salto de página encontrado en párrafo ${i}: "${parrafo.texto || '[vacío]'}"`);
            return true;
        }
    }
    
    return false;
}

async function analizarEspaciadoParrafos(rutaArchivo) {
    try {
        const buffer = fs.readFileSync(rutaArchivo);
        const zip = await JSZip.loadAsync(buffer);
        const documentXml = await zip.file("word/document.xml").async("string");
        const stylesXml = await zip.file("word/styles.xml").async("string");

        let errores = [];
        let correctos = [];
        let contadorErrores = 0;

        console.log("📏 ANALIZANDO ESPACIADO ENTRE PÁRRAFOS...");

        // 🔥 SEPARAR EL DOCUMENTO EN BLOQUES (párrafos y tablas) PARA DETECTAR LEYENDAS DE TABLA
const bloques = documentXml.match(/<w:tbl\b[\s\S]*?<\/w:tbl>|<w:p[\s\S]*?<\/w:p>/g) || [];

// 🔥 CREAR UN SET CON LOS PÁRRAFOS QUE SON LEYENDAS DE TABLA (título superior o fuente inferior)
const parrafosLeyendaDeTabla = new Set();

for (let i = 0; i < bloques.length; i++) {
    const bloque = bloques[i];
    
    // Si el bloque es una TABLA
    if (bloque.startsWith('<w:tbl')) {
        // 🔥 El párrafo ANTERIOR es el TÍTULO de la tabla
        if (i > 0 && bloques[i - 1].startsWith('<w:p')) {
            parrafosLeyendaDeTabla.add(bloques[i - 1]);
        }
        // 🔥 El párrafo SIGUIENTE es la FUENTE de la tabla
        if (i < bloques.length - 1 && bloques[i + 1].startsWith('<w:p')) {
            parrafosLeyendaDeTabla.add(bloques[i + 1]);
        }
    }
}

console.log(`📊 Leyendas de tabla detectadas: ${parrafosLeyendaDeTabla.size}`);

// 🔥 AHORA QUITAR SOLO LAS TABLAS DEL XML PARA ANALIZAR PÁRRAFOS
const partes = documentXml.split(/(<w:tbl\b[\s\S]*?<\/w:tbl>)/);

let documentXmlSinTablas = '';
let tablasIgnoradas = 0;

for (const parte of partes) {
    if (parte.startsWith('<w:tbl')) {
        tablasIgnoradas++;
    } else {
        documentXmlSinTablas += parte;
    }
}

console.log(`📊 Tablas ignoradas: ${tablasIgnoradas}`);
console.log(`📄 Longitud original: ${documentXml.length}, sin tablas: ${documentXmlSinTablas.length}`);

const parrafos = documentXmlSinTablas.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
        
        if (parrafos.length === 0) {
            errores.push("No se encontraron párrafos en el documento");
            return { correcto: false, correctos, errores };
        }

        // 🔥 FUNCIÓN MEJORADA: Limpia TODO el XML residual
        function extraerTexto(parrafo) {
            let texto = [...parrafo.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
                .map(t => t[1])
                .join("");
            
            // 🔥 LIMPIAR CUALQUIER ETIQUETA XML RESIDUAL
            texto = texto.replace(/<[^>]+>/g, '');
            
            // 🔥 LIMPIAR SALTOS DE LÍNEA Y ESPACIOS MÚLTIPLES
            texto = texto.replace(/[\r\n\t]+/g, ' ');
            texto = texto.replace(/\s+/g, ' ');
            
            return texto.trim();
        }

        function esParrafoVacio(parrafo) {
            const texto = extraerTexto(parrafo);
            return texto.length === 0;
        }

        function obtenerAfter(parrafo) {
            let after = null;
            const spacingMatch = parrafo.match(/<w:spacing\b[^>]*>/);
            if (spacingMatch) {
                const afterMatch = spacingMatch[0].match(/w:after="([^"]+)"/);
                if (afterMatch) after = parseInt(afterMatch[1]);
            }
            return after;
        }

        function getTipo(texto, parrafo, index) {
            // 🔥 LIMPIAR XML DEL TEXTO ANTES DE CUALQUIER COSA
            texto = texto.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            
            const textoLower = texto.toLowerCase().trim();
            
            // 🔥 LIMPIAR CARACTERES DE FORMATO - MEJORADO
            let textoLimpio = texto;
            textoLimpio = textoLimpio.replace(/^#+\s*/, '');  // Eliminar ##, ###
            textoLimpio = textoLimpio.replace(/^\*+\s*/, '');  // Eliminar **
            textoLimpio = textoLimpio.replace(/^[-•]\s*/, ''); // Eliminar viñetas
            textoLimpio = textoLimpio.trim();
            
            const textoLimpioLower = textoLimpio.toLowerCase().trim();
            
            // 🔥 DETECTAR BIBLIOGRAFÍA Y ANEXOS COMO TÍTULOS
            if (textoLimpioLower === "bibliografía" || textoLimpioLower === "bibliografia" || 
                textoLimpioLower === "anexos" || textoLimpioLower === "anexo") {
                return 'TITULO';
            }
            
            // 🔥🔥🔥 DETECCIÓN MEJORADA DE SUBSUBTÍTULOS
            const patronSubsubtitulo = /[IVXLCDM]+\.\d+\.\d+/;
            if (patronSubsubtitulo.test(textoLimpio)) {
                console.log(`   🔥🔥🔥 FORZADO SUBSUBTITULO: "${texto}" → SUBSUBTITULO (limpiado: "${textoLimpio}")`);
                return 'SUBSUBTITULO';
            }
            
            // 🔥 DETECCIÓN MEJORADA DE SUBTÍTULOS
            const patronSubtitulo = /[IVXLCDM]+\.\d+/;
            if (patronSubtitulo.test(textoLimpio) && !patronSubsubtitulo.test(textoLimpio)) {
                console.log(`   🔥🔥🔥 FORZADO SUBTITULO: "${texto}" → SUBTITULO (limpiado: "${textoLimpio}")`);
                return 'SUBTITULO';
            }
            
            const subtitulosForzados = [
                "i.1 conceptualización de la estadía",
                "ii.1 marco referencial"
            ];
            
            for (const forzado of subtitulosForzados) {
                if (textoLimpioLower === forzado) {
                    console.log(`   🔥🔥🔥 FORZADO ESPECIAL: "${texto}" → SUBTITULO`);
                    return 'SUBTITULO';
                }
            }
            
            if (/^[IVXLCDM]+\.\s+/.test(textoLimpio) && textoLimpio === textoLimpio.toUpperCase()) return 'TITULO';
            if (["BIBLIOGRAFÍA", "ANEXOS"].includes(textoLimpio)) return 'TITULO';
            if (textoLimpio === textoLimpio.toUpperCase() && textoLimpio.length < 30 && !/^\d+\./.test(textoLimpio)) return 'TITULO';
            
            const subtitulosConocidos = [
                "Conceptualización de la estadía",
                "Contextualización",
                "Marco referencial",
                "Estado del Arte",
                "Materiales y métodos",
                "Procesamiento de resultados, análisis y discusión",
                "Microeconomía de la empresa",
                "Motivo de estudio",
                "Desarrollo del Objetivo",
                "Localización geográfica de la empresa",
                "Giro y tamaño de la empresa",
                "Área de influencia",
                "Objetivos de la empresa"
            ];
            
            let esSubtituloConocido = false;
            for (const nombre of subtitulosConocidos) {
                if (textoLimpio.toLowerCase().includes(nombre.toLowerCase())) {
                    esSubtituloConocido = true;
                    break;
                }
            }
            
            const tieneNegrita = /<w:b\s*\/>/.test(parrafo) ||
                                /<w:b\s+[^>]*>/.test(parrafo) ||
                                /<w:b\s*>/.test(parrafo) ||
                                /<w:b[^>]*w:val="1"/.test(parrafo) ||
                                /<w:b[^>]*w:val="true"/.test(parrafo);
            
            const estaCentrado = parrafo.includes('w:jc w:val="center"');
            
            if (esSubtituloConocido) {
                console.log(`   🔥 FORZADO CONOCIDO: "${texto}" → SUBTITULO`);
                return 'SUBTITULO';
            }
            
            if (tieneNegrita && !estaCentrado && textoLimpio.length < 80 && textoLimpio.length > 5) {
                if (textoLimpio !== textoLimpio.toUpperCase() || textoLimpio.length < 30) {
                    return 'SUBTITULO';
                }
            }
            
            return 'TEXTO';
        }

        const parrafosConTexto = [];
        let contadorIndex = 0;
        
        parrafos.forEach((parrafo, index) => {
    const texto = extraerTexto(parrafo);
    const esVacio = texto.length === 0;
    
    // 🔥 SI EL PÁRRAFO ES UNA LEYENDA DE TABLA, TRATARLO COMO TEXTO NORMAL
    const esLeyendaDeTabla = parrafosLeyendaDeTabla.has(parrafo);
    
    parrafosConTexto.push({
        index: contadorIndex,
        originalIndex: index,
        texto: texto,
        parrafo: parrafo,
        esVacio: esVacio,
        // 🔥 LEYENDAS DE TABLA = TEXTO (no subtítulo)
        tipo: esVacio ? 'VACIO' : (esLeyendaDeTabla ? 'TEXTO' : getTipo(texto, parrafo, index)),
        after: obtenerAfter(parrafo),
        esLeyendaDeTabla: esLeyendaDeTabla
    });
    contadorIndex++;
});

        console.log("📊 TIPOS DETECTADOS:");
        let subtitulosEncontrados = 0;
        parrafosConTexto.forEach(p => {
            if (!p.esVacio && p.tipo !== 'TEXTO') {
                console.log(`   "${p.texto}" → ${p.tipo}`);
                subtitulosEncontrados++;
            }
        });
        console.log(`   Total subtítulos/títulos detectados: ${subtitulosEncontrados}`);
        console.log("============================================");

        function verificarSaltosDePagina(parrafosConTexto) {
            const erroresSaltos = [];
            const parrafosNoVacios = parrafosConTexto.filter(p => !p.esVacio);
            
            for (let i = 0; i < parrafosNoVacios.length; i++) {
                const actual = parrafosNoVacios[i];
                
                const esTituloPrincipal = 
                    (actual.tipo === 'TITULO' && /^[IVXLCDM]+\.\s+/.test(actual.texto)) ||
                    actual.texto === "BIBLIOGRAFÍA" ||
                    actual.texto === "ANEXOS";
                
                if (esTituloPrincipal) {
                    if (i === 0) continue;
                    
                    const tieneSalto = actual.parrafo.includes('w:br w:type="page"') || 
                                      actual.parrafo.includes('w:pageBreak') ||
                                      actual.parrafo.includes('<w:lastRenderedPageBreak') ||
                                      actual.parrafo.includes('w:pageBreakBefore');
                    
                    if (!tieneSalto) {
                        erroresSaltos.push({
                            tipo: "espaciado_parrafos",
                            buscar: "espaciado_parrafos",
                            mensaje: `❌ El capítulo "${limpiarTextoParaMensaje(actual.texto)}" debe comenzar en una hoja nueva.`,
                            parrafoIncorrecto: actual.parrafo,
                            textoParrafo: limpiarTextoParaMensaje(actual.texto)
                        });
                        console.log(`   ❌ ${actual.texto} NO tiene salto de página`);
                    } else {
                        console.log(`   ✅ ${actual.texto} tiene salto de página`);
                    }
                }
            }
            
            return erroresSaltos;
        }

        const erroresSaltos = verificarSaltosDePagina(parrafosConTexto);
        errores.push(...erroresSaltos);
        console.log(`📊 Saltos de página: ${erroresSaltos.length} errores`);

        const parrafosNoVacios = parrafosConTexto.filter(p => !p.esVacio);

        const subtitulosProblematicos = [
            "I.1 Conceptualización de la estadía",
            "II.1 Marco referencial"
        ];

        function contarVaciosEntre(idx1, idx2) {
            if (idx1 > idx2) [idx1, idx2] = [idx2, idx1];
            let count = 0;
            for (let j = idx1 + 1; j < idx2; j++) {
                if (parrafosConTexto[j] && parrafosConTexto[j].esVacio) {
                    count++;
                }
            }
            return count;
        }

        // 🔥 Verificar todos los casos de PÁRRAFO → SUBSUBTITULO
        console.log("🔍 VERIFICANDO CASOS ESPECIALES: PÁRRAFO → SUBSUBTITULO");
        for (let i = 0; i < parrafosNoVacios.length; i++) {
            const actual = parrafosNoVacios[i];
            const siguiente = i < parrafosNoVacios.length - 1 ? parrafosNoVacios[i + 1] : null;
            
            // Si el actual NO es un título/subtítulo y el siguiente es SUBSUBTITULO
            const actualNoEsTitulo = actual.tipo !== 'TITULO' && actual.tipo !== 'SUBTITULO' && actual.tipo !== 'SUBSUBTITULO';
            
            if (actualNoEsTitulo && siguiente && siguiente.tipo === 'SUBSUBTITULO') {
                console.log(`🔍 CASO ESPECIAL: PÁRRAFO → SUBSUBTITULO`);
                console.log(`   Párrafo: "${actual.texto.substring(0, 30)}..." (tipo: ${actual.tipo})`);
                console.log(`   Subsubtítulo: "${siguiente.texto}"`);
                
                const idxActual = actual.originalIndex;
                const idxSiguiente = siguiente.originalIndex;
                const vaciosEntre = contarVaciosEntre(idxActual, idxSiguiente);
                const afterActual = actual.after;
                
                console.log(`   Párrafos vacíos entre: ${vaciosEntre}`);
                console.log(`   After del párrafo: ${afterActual ?? 'null'}pt`);
                
                // 🔥 SIEMPRE VERIFICAR - NO IMPORTAN LOS SALTOS DE PÁGINA
                const tiene2Espacios = vaciosEntre === 2 || 
                                      (afterActual !== null && Math.abs(afterActual - 240) <= 30);
                
                if (tiene2Espacios) {
                    console.log(`   ✅ CORRECTO (2 espacios)`);
                } else {
                    const mensajeError = `❌ Entre el último párrafo y el subsubtítulo "${limpiarTextoParaMensaje(siguiente.texto)}" debe haber 2 espacios.`;
                    console.log(`   ❌ ${mensajeError}`);
                    const yaExiste = errores.some(e => e.mensaje === mensajeError);
                    if (!yaExiste) {
                        errores.push({
                            tipo: "espaciado_parrafos",
                            buscar: "espaciado_parrafos",
                            mensaje: mensajeError,
                            parrafoIncorrecto: actual.parrafo,
                            textoParrafo: limpiarTextoParaMensaje(actual.texto)
                        });
                    }
                }
            }
        }

        // 🔥 Verificar las reglas estándar
        for (let i = 0; i < parrafosNoVacios.length; i++) {
            const actual = parrafosNoVacios[i];
            const anterior = i > 0 ? parrafosNoVacios[i - 1] : null;
            const siguiente = i < parrafosNoVacios.length - 1 ? parrafosNoVacios[i + 1] : null;
            
            const idxActual = actual.originalIndex;
            const idxAnterior = anterior ? anterior.originalIndex : -1;
            const idxSiguiente = siguiente ? siguiente.originalIndex : -1;
            
            let mensajeError = null;
            let parrafoError = null;
            let textoError = null;
            
            const esProblematico = subtitulosProblematicos.some(nombre => 
                actual.texto.toLowerCase().includes(nombre.toLowerCase())
            );
            
            if (actual.tipo === 'TITULO' || actual.tipo === 'SUBTITULO' || actual.tipo === 'SUBSUBTITULO') {
                console.log(`🔍 Verificando: "${actual.texto.substring(0, 40)}..." (${actual.tipo})`);
                console.log(`   Índice real: ${idxActual}`);
                if (esProblematico) {
                    console.log(`   ⚠️ ESTE ES UN SUBTÍTULO PROBLEMÁTICO - FORZANDO VERIFICACIÓN`);
                }
            }
            
            // REGLA 1: TÍTULO → SUBTÍTULO (1 espacio)
            if (actual.tipo === 'SUBTITULO' && anterior && anterior.tipo === 'TITULO') {
                const vaciosEntre = contarVaciosEntre(idxAnterior, idxActual);
                const afterAnterior = anterior.after;
                
                console.log(`   📌 TÍTULO → SUBTÍTULO: "${anterior.texto}" → "${actual.texto}"`);
                console.log(`   Párrafos vacíos entre: ${vaciosEntre}`);
                console.log(`   After del título: ${afterAnterior ?? 'null'}pt`);
                
                // 🔥 SIEMPRE VERIFICAR - NO IMPORTAN LOS SALTOS DE PÁGINA
                const tiene1Espacio = vaciosEntre === 1 || 
                                     (afterAnterior !== null && Math.abs(afterAnterior - 120) <= 30);
                
                if (tiene1Espacio) {
                    console.log(`   ✅ CORRECTO (1 espacio)`);
                } else {
                    mensajeError = `❌ Entre el título "${limpiarTextoParaMensaje(anterior.texto)}" y el subtítulo "${limpiarTextoParaMensaje(actual.texto)}" debe haber 1 espacio.`;
                    parrafoError = actual.parrafo;
                    textoError = limpiarTextoParaMensaje(actual.texto);
                    console.log(`   ❌ ${mensajeError}`);
                }
            }
            
            // REGLA 2: SUBTÍTULO → SUBSUBTÍTULO (1 espacio)
            if (actual.tipo === 'SUBSUBTITULO' && anterior && anterior.tipo === 'SUBTITULO') {
                const vaciosEntre = contarVaciosEntre(idxAnterior, idxActual);
                const afterAnterior = anterior.after;
                
                console.log(`   📌 SUBTÍTULO → SUBSUBTÍTULO: "${anterior.texto}" → "${actual.texto}"`);
                console.log(`   Párrafos vacíos entre: ${vaciosEntre}`);
                console.log(`   After del subtítulo: ${afterAnterior ?? 'null'}pt`);
                
                // 🔥 SIEMPRE VERIFICAR - NO IMPORTAN LOS SALTOS DE PÁGINA
                const tiene1Espacio = vaciosEntre === 1 || 
                                     (afterAnterior !== null && Math.abs(afterAnterior - 120) <= 30);
                
                if (tiene1Espacio) {
                    console.log(`   ✅ CORRECTO (1 espacio)`);
                } else {
                    mensajeError = `❌ Entre el subtítulo "${limpiarTextoParaMensaje(anterior.texto)}" y el subsubtítulo "${limpiarTextoParaMensaje(actual.texto)}" debe haber 1 espacio.`;
                    parrafoError = actual.parrafo;
                    textoError = limpiarTextoParaMensaje(actual.texto);
                    console.log(`   ❌ ${mensajeError}`);
                }
            }
            
            // REGLA 3: SUBTÍTULO/SUBSUBTÍTULO → PRIMER PÁRRAFO (2 espacios)
            if ((actual.tipo === 'SUBTITULO' || actual.tipo === 'SUBSUBTITULO' || esProblematico) && 
                siguiente && (siguiente.tipo === 'TEXTO' || siguiente.tipo === 'SUBTITULO' || siguiente.tipo === 'SUBSUBTITULO')) {
                
                const esMismoTipo = siguiente.tipo === actual.tipo;
                const esSubtituloSiguiente = siguiente.tipo === 'SUBTITULO' || siguiente.tipo === 'SUBSUBTITULO';
                
                if (siguiente.tipo === 'TEXTO' || 
                    (esSubtituloSiguiente && !esMismoTipo) ||
                    (actual.tipo === 'SUBSUBTITULO' && siguiente.tipo === 'SUBTITULO') ||
                    esProblematico) {
                    
                    const vaciosEntre = contarVaciosEntre(idxActual, idxSiguiente);
                    const afterActual = actual.after;
                    const tipoTexto = actual.tipo === 'SUBTITULO' ? 'subtítulo' : 'subsubtítulo';
                    
                    console.log(`   📌 ${tipoTexto.toUpperCase()} → PÁRRAFO: "${actual.texto}" → "${siguiente.texto.substring(0, 20)}..."`);
                    console.log(`   Párrafos vacíos entre: ${vaciosEntre}`);
                    console.log(`   After del ${tipoTexto}: ${afterActual ?? 'null'}pt`);
                    
                    // 🔥 SIEMPRE VERIFICAR - NO IMPORTAN LOS SALTOS DE PÁGINA
                    const tiene2Espacios = vaciosEntre === 2 || 
                                          (afterActual !== null && Math.abs(afterActual - 240) <= 30);
                    
                    if (tiene2Espacios) {
                        console.log(`   ✅ CORRECTO (2 espacios)`);
                    } else {
                        mensajeError = `❌ Entre el ${tipoTexto} "${limpiarTextoParaMensaje(actual.texto)}" y el primer párrafo debe haber 2 espacios.`;
                        parrafoError = actual.parrafo;
                        textoError = limpiarTextoParaMensaje(actual.texto);
                        console.log(`   ❌ ${mensajeError}`);
                    }
                }
            }
            
            // REGLA 4: PÁRRAFO → PÁRRAFO (1 espacio)
            if (actual.tipo === 'TEXTO' && anterior && anterior.tipo === 'TEXTO') {
                const vaciosEntre = contarVaciosEntre(idxAnterior, idxActual);
                const afterAnterior = anterior.after;
                
                console.log(`   📌 PÁRRAFO → PÁRRAFO`);
                console.log(`   Párrafos vacíos entre: ${vaciosEntre}`);
                console.log(`   After del anterior: ${afterAnterior ?? 'null'}pt`);
                
                const tiene1Espacio = vaciosEntre === 1 || 
                                     (afterAnterior !== null && Math.abs(afterAnterior - 120) <= 30);
                
                if (tiene1Espacio) {
                    console.log(`   ✅ CORRECTO (1 espacio)`);
                } else {
                    mensajeError = `❌ Entre párrafos debe haber 1 espacio.`;
                    parrafoError = actual.parrafo;
                    textoError = limpiarTextoParaMensaje(actual.texto);
                    console.log(`   ❌ ${mensajeError}`);
                }
            }
            
            // REGLA 5: ÚLTIMO PÁRRAFO → SIGUIENTE TÍTULO/SUBTÍTULO (2 espacios)
            if (actual.tipo === 'TEXTO' && siguiente && (siguiente.tipo === 'TITULO' || siguiente.tipo === 'SUBTITULO' || siguiente.tipo === 'SUBSUBTITULO')) {
                const vaciosEntre = contarVaciosEntre(idxActual, idxSiguiente);
                const afterActual = actual.after;
                const tipoSiguiente = siguiente.tipo === 'TITULO' ? 'título' : siguiente.tipo === 'SUBTITULO' ? 'subtítulo' : 'subsubtítulo';
                
                console.log(`   📌 PÁRRAFO → ${tipoSiguiente.toUpperCase()}: "${actual.texto.substring(0, 20)}..." → ${siguiente.texto}`);
                console.log(`   Párrafos vacíos entre: ${vaciosEntre}`);
                console.log(`   After del párrafo: ${afterActual ?? 'null'}pt`);
                
                // 🔥 DETECTAR SI ES UN TÍTULO PRINCIPAL
                const esTituloPrincipal = 
                    (siguiente.tipo === 'TITULO' && /^[IVXLCDM]+\.\s+/.test(siguiente.texto)) ||
                    siguiente.texto === "BIBLIOGRAFÍA" ||
                    siguiente.texto === "ANEXOS";
                
                // 🔥 SOLO IGNORAR SI ES TÍTULO PRINCIPAL (I., II., III., etc.)
                if (esTituloPrincipal) {
                    console.log(`   ✅✅✅ TÍTULO PRINCIPAL - IGNORANDO COMPLETAMENTE VERIFICACIÓN DE ESPACIADO`);
                } else {
                    // 🔥 SIEMPRE VERIFICAR - NO IMPORTAN LOS SALTOS DE PÁGINA
                    const tiene2Espacios = vaciosEntre === 2 || 
                                          (afterActual !== null && Math.abs(afterActual - 240) <= 30);
                    
                    if (tiene2Espacios) {
                        console.log(`   ✅ CORRECTO (2 espacios)`);
                    } else {
                        mensajeError = `❌ Entre el último párrafo y el ${tipoSiguiente} "${limpiarTextoParaMensaje(siguiente.texto)}" debe haber 2 espacios.`;
                        parrafoError = actual.parrafo;
                        textoError = limpiarTextoParaMensaje(actual.texto);
                        console.log(`   ❌ ${mensajeError}`);
                    }
                }
            }
            
            if (mensajeError) {
                contadorErrores++;
                const yaExiste = errores.some(e => e.mensaje === mensajeError);
                if (!yaExiste) {
                    errores.push({
                        tipo: "espaciado_parrafos",
                        buscar: "espaciado_parrafos",
                        mensaje: mensajeError,
                        parrafoIncorrecto: parrafoError,
                        textoParrafo: textoError
                    });
                }
            }
        }

        console.log("============================================");
        console.log(`📊 Total errores encontrados: ${contadorErrores}`);

        if (contadorErrores === 0 && erroresSaltos.length === 0) {
            correctos.push("✅ El documento tiene los espaciados correctos entre párrafos.");
        }

        return { correcto: errores.length === 0, correctos, errores };

    } catch (error) {
        console.error("❌ Error:", error);
        return {
            correcto: false,
            mensaje: error.message,
            errores: [`Error: ${error.message}`],
            correctos: []
        };
    }
}

module.exports = analizarEspaciadoParrafos;