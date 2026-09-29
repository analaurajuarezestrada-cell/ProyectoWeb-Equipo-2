const fs = require("fs");
const JSZip = require("jszip");

// 🔥 FUNCIÓN PARA RESOLVER FUENTE DEL TEMA
function resolverFuenteTema(tema, themeXml) {
    if (!themeXml) return null;
    
    try {
        const fontSchemeMatch = themeXml.match(/<a:fontScheme[\s\S]*?<\/a:fontScheme>/);
        if (!fontSchemeMatch) return null;

        let tipoFuente = null;
        if (tema === "majorHAnsi" || tema === "majorAscii" || tema === "major") {
            tipoFuente = "majorFont";
        } else if (tema === "minorHAnsi" || tema === "minorAscii" || tema === "minor") {
            tipoFuente = "minorFont";
        }
        
        if (!tipoFuente) return null;

        const bloqueFuente = fontSchemeMatch[0].match(new RegExp(`<a:${tipoFuente}[\\s\\S]*?<\\/a:${tipoFuente}>`));
        if (!bloqueFuente) return null;

        const typefaceMatch = bloqueFuente[0].match(/typeface="([^"]+)"/);
        if (typefaceMatch) {
            return typefaceMatch[1];
        }

        const latin = bloqueFuente[0].match(/<a:latin\b[^>]*typeface="([^"]+)"/);
        if (latin) return latin[1];

        return null;
    } catch (error) {
        return null;
    }
}

// 🔥 FUNCIÓN PARA DETECTAR SI ES UN TÍTULO DE CAPÍTULO
function esTituloCapitulo(texto) {
    const textoTrim = texto.trim();
    const textoUpper = textoTrim.toUpperCase();
    
    if (/^[IVXLCDM]+\.\s/.test(textoTrim) && textoTrim.length <= 80) {
        return true;
    }
    
    const capitulos = [
        "I. INTRODUCCIÓN", "II. DESARROLLO", "III. CONCLUSIONES",
        "BIBLIOGRAFÍA", "ANEXOS", "III. CONCLUSIONES Y RECOMENDACIONES",
        "II. OBJETIVOS", "IV. MARCO TEÓRICO", "V. METODOLOGÍA",
        "VI. RESULTADOS", "I. INTRODUCCION", "II. DESARROLLO",
        "III. CONCLUSIONES Y RECOMENDACIONES", "IV. MARCO TEORICO"
    ];
    
    if (capitulos.some(c => textoUpper === c.toUpperCase())) {
        return true;
    }
    
    if (/^[IVXLCDM]+\.\s/.test(textoUpper) && textoTrim === textoTrim.toUpperCase()) {
        return true;
    }
    
    return false;
}

// 🔥 FUNCIÓN PARA DETECTAR SUBTÍTULOS
function esSubtitulo(texto) {
    const textoTrim = texto.trim();
    const textoUpper = textoTrim.toUpperCase();
    
    if (esTituloCapitulo(texto)) {
        return false;
    }
    
    if (/^[IVXLCDM]+\.\d/.test(textoUpper) && !esTituloCapitulo(texto)) {
        return true;
    }
    
    const patrones = [
        /^[IVXLCDM]+\.\d+\s+/,
        /^[IVXLCDM]+\.\d+\.\d+\s+/,
        /^[IVXLCDM]+\.\d+\.\d+\.\d+\s+/,
        /^\d+\.\d+\s+/,
        /^\d+\.\d+\.\d+\s+/,
        /^\d+\.\d+\.\d+\.\d+\s+/,
    ];
    
    return patrones.some(p => p.test(textoUpper));
}

// 🔥 FUNCIÓN PARA OBTENER LA FUENTE DE UN PÁRRAFO
function obtenerFuenteParrafo(parrafo, stylesXml, themeXml) {
    // 1. Buscar en rFonts del texto
    const rFontsMatch = parrafo.match(/<w:rFonts\b[^>]*>/);
    if (rFontsMatch) {
        const rFonts = rFontsMatch[0];
        
        const asciiMatch = rFonts.match(/w:ascii="([^"]+)"/);
        if (asciiMatch) {
            return asciiMatch[1];
        }
        
        const hAnsiMatch = rFonts.match(/w:hAnsi="([^"]+)"/);
        if (hAnsiMatch) {
            return hAnsiMatch[1];
        }
        
        const asciiThemeMatch = rFonts.match(/w:asciiTheme="([^"]+)"/);
        if (asciiThemeMatch) {
            const tema = asciiThemeMatch[1];
            const fuenteResuelta = resolverFuenteTema(tema, themeXml);
            if (fuenteResuelta) {
                return fuenteResuelta;
            }
            return "theme:" + tema;
        }
        
        const hAnsiThemeMatch = rFonts.match(/w:hAnsiTheme="([^"]+)"/);
        if (hAnsiThemeMatch) {
            const tema = hAnsiThemeMatch[1];
            const fuenteResuelta = resolverFuenteTema(tema, themeXml);
            if (fuenteResuelta) {
                return fuenteResuelta;
            }
            return "theme:" + tema;
        }
    }
    
    // 2. Buscar en el estilo del párrafo
    const estiloMatch = parrafo.match(/<w:pStyle\b[^>]*w:val="([^"]+)"/);
    if (estiloMatch) {
        const estiloId = estiloMatch[1];
        const regex = new RegExp(`<w:style\\b[^>]*w:styleId="${estiloId}"[\\s\\S]*?<\\/w:style>`);
        const estiloXml = stylesXml.match(regex);
        if (estiloXml) {
            const rFontsEstilo = estiloXml[0].match(/<w:rFonts\b[^>]*>/);
            if (rFontsEstilo) {
                const rFonts = rFontsEstilo[0];
                
                const asciiMatch = rFonts.match(/w:ascii="([^"]+)"/);
                if (asciiMatch) {
                    return asciiMatch[1];
                }
                const hAnsiMatch = rFonts.match(/w:hAnsi="([^"]+)"/);
                if (hAnsiMatch) {
                    return hAnsiMatch[1];
                }
                const asciiThemeMatch = rFonts.match(/w:asciiTheme="([^"]+)"/);
                if (asciiThemeMatch) {
                    const tema = asciiThemeMatch[1];
                    const fuenteResuelta = resolverFuenteTema(tema, themeXml);
                    if (fuenteResuelta) {
                        return fuenteResuelta;
                    }
                    return "theme:" + tema;
                }
            }
        }
    }
    
    // 3. Buscar en docDefaults
    const docDefaults = stylesXml.match(/<w:docDefaults[\s\S]*?<\/w:docDefaults>/);
    if (docDefaults) {
        const rFontsDefault = docDefaults[0].match(/<w:rFonts\b[^>]*>/);
        if (rFontsDefault) {
            const asciiMatch = rFontsDefault[0].match(/w:ascii="([^"]+)"/);
            if (asciiMatch) {
                return asciiMatch[1];
            }
        }
    }
    
    return "NO_DETECTADA";
}

// 🔥 FUNCIÓN PARA VERIFICAR SI ES ARIAL
function esFuenteArial(fuente, themeXml) {
    const fuentesArial = ["arial", "arialmt", "arial narrow", "arialnarrow", "arial black", "arialblack", "helvetica"];
    
    if (!fuente) return false;
    const fuenteNormalizada = fuente.toLowerCase().trim();
    
    // Si es NO_DETECTADA, considerar como Arial (fallback)
    if (fuenteNormalizada === "no_detectada" || fuenteNormalizada === "desconocida") {
        return true;
    }
    
    // Verificar si es Arial directamente
    for (const fuenteValida of fuentesArial) {
        if (fuenteNormalizada === fuenteValida || fuenteNormalizada.includes(fuenteValida)) {
            return true;
        }
    }
    
    // Si es un tema, resolver
    if (fuenteNormalizada.startsWith("theme:")) {
        const tema = fuenteNormalizada.replace("theme:", "");
        const fuenteResuelta = resolverFuenteTema(tema, themeXml);
        if (fuenteResuelta) {
            const fuenteResueltaNorm = fuenteResuelta.toLowerCase().trim();
            for (const fuenteValida of fuentesArial) {
                if (fuenteResueltaNorm === fuenteValida || fuenteResueltaNorm.includes(fuenteValida)) {
                    return true;
                }
            }
        }
        if (tema === "minorHAnsi" || tema === "majorHAnsi" || tema === "minorAscii" || tema === "majorAscii") {
            return true;
        }
    }
    
    return false;
}

// 🔥 FUNCIÓN PRINCIPAL
async function analizarTamanoTexto(rutaArchivo) {
    try {
        const buffer = fs.readFileSync(rutaArchivo);
        const zip = await JSZip.loadAsync(buffer);
        const documentXml = await zip.file("word/document.xml").async("string");
        const stylesXml = await zip.file("word/styles.xml").async("string");
        const themeXml = await zip.file("word/theme/theme1.xml").async("string");

        let errores = [];
        let correctos = [];

        console.log("📏 ANALIZANDO TAMAÑO DE TEXTO NORMAL (12pt) Y FUENTE ARIAL...");

        // 🔥 IMPORTANTE: Quitar tablas ANTES de analizar párrafos
        // El texto DENTRO de tablas NO debe validarse como texto normal
        const tablasEncontradas = documentXml.match(/<w:tbl\b/g);
        console.log(`📊 Tablas encontradas en el documento: ${tablasEncontradas ? tablasEncontradas.length : 0}`);
        
        const documentXmlSinTablas = documentXml.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, '');
        console.log(`📄 Longitud original: ${documentXml.length}, sin tablas: ${documentXmlSinTablas.length}`);

        const parrafos = documentXmlSinTablas.match(/<w:p[\s\S]*?<\/w:p>/g);
        if (!parrafos || parrafos.length === 0) {
            errores.push("No se encontraron párrafos en el documento");
            return { correcto: false, correctos, errores };
        }

        let parrafosRevisados = 0;
        let parrafosCorrectos = 0;

        for (const parrafo of parrafos) {
            // 🔥 EXTRAER TEXTO DEL PÁRRAFO
            const textos = [...parrafo.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)]
                .map(t => t[1])
                .join("")
                .trim();

            if (!textos || textos.length === 0) continue;

            // 🔥 VALIDACIÓN DE TÍTULOS PRINCIPALES (ANTES DE TODO)
            if (/^[IVXLCDM]+\.\s/.test(textos.trim()) && textos.length <= 80) {
                console.log(`⏭️ Ignorando título principal: "${textos.substring(0, 40)}..."`);
                continue;
            }

            const textoUpper = textos.toUpperCase().trim();

            // 🔥 VERIFICAR SI ES TÍTULO DE CAPÍTULO (SALTAR)
            if (esTituloCapitulo(textos)) {
                console.log(`⏭️ Saltando título: "${textos.substring(0, 30)}..."`);
                continue;
            }

            // 🔥 VERIFICAR SI ES SUBTÍTULO (SALTAR)
            if (esSubtitulo(textos)) {
                console.log(`⏭️ Saltando subtítulo: "${textos.substring(0, 30)}..."`);
                continue;
            }

                        // 🔥 VERIFICAR SI ES LEYENDA DE IMAGEN/TABLA (SALTAR)
            const esLeyenda = /^(Figura|Gráfica|Grafico|Gráfico|Ilustración|Ilustracion|Imagen|Tabla)\s+\d+/i.test(textos.trim());
            if (esLeyenda) {
                console.log(`⏭️ Saltando leyenda de imagen: "${textos.substring(0, 40)}..."`);
                continue;
            }

            // 🔥 VERIFICAR SI EL PÁRRAFO TIENE NUMERACIÓN O VIÑETAS
            const tieneNumeracion = /^(\d+\.|\d+\)|[a-zA-Z]\)|[ivxlcdm]+\)|•|-|–|—|\*)/.test(textos.trim());
            if (tieneNumeracion) {
                console.log(`⏭️ Saltando lista: "${textos.substring(0, 30)}..."`);
                continue;
            }

            // 🔥 BUSCAR EL TAMAÑO DEL PÁRRAFO
            const sizeMatch = parrafo.match(/<w:sz\s+w:val="([^"]+)"/);
            let tamano = null;

            if (sizeMatch) {
                tamano = parseInt(sizeMatch[1]);
            }

            if (tamano === null) {
                tamano = 24;
            }

            // 🔥 OBTENER LA FUENTE DEL PÁRRAFO
            const fuente = obtenerFuenteParrafo(parrafo, stylesXml, themeXml);
            const esArial = esFuenteArial(fuente, themeXml);

            parrafosRevisados++;

            // 🔥 VALIDAR TAMAÑO (12pt = 24 en el XML)
            const tamanoCorrecto = tamano === 24;
            
            // 🔥 VALIDAR FUENTE ARIAL
            const fuenteCorrecta = esArial;

            if (tamanoCorrecto && fuenteCorrecta) {
                parrafosCorrectos++;
            } else {
                const tamanoReal = (tamano / 2).toFixed(1);
                let mensajeError = "";
                
                if (!tamanoCorrecto && !fuenteCorrecta) {
                    mensajeError = `El párrafo "${textos.substring(0, 50)}${textos.length > 50 ? '...' : ''}" tiene tamaño ${tamanoReal}pt (debe ser 12pt) y fuente "${fuente || 'NO DETECTADA'}" (debe ser Arial)`;
                } else if (!tamanoCorrecto) {
                    mensajeError = `El párrafo "${textos.substring(0, 50)}${textos.length > 50 ? '...' : ''}" tiene tamaño ${tamanoReal}pt, debe ser 12pt`;
                } else if (!fuenteCorrecta) {
                    mensajeError = `El párrafo "${textos.substring(0, 50)}${textos.length > 50 ? '...' : ''}" debe utilizar fuente Arial (fuente actual: "${fuente || 'NO DETECTADA'}")`;
                }
                
                errores.push({
                    tipo: "tamanio_texto",
                    buscar: textos,
                    mensaje: mensajeError
                });
                
                console.log(`❌ Error: "${textos.substring(0, 30)}..." - Tamaño: ${tamanoReal}pt, Fuente: ${fuente || 'NO DETECTADA'}`);
            }
        }

        if (parrafosRevisados === 0) {
            correctos.push("✅ No se encontró texto normal para validar");
        } else if (errores.length === 0) {
            correctos.push(`✅ Todos los párrafos de texto normal tienen tamaño 12pt y fuente Arial (${parrafosCorrectos} párrafos revisados)`);
        } else {
            console.log(`❌ Se encontraron ${errores.length} párrafos con problemas de tamaño o fuente`);
        }

        console.log(`📏 Análisis completado. Errores: ${errores.length}, Aciertos: ${correctos.length}`);
        console.log(`📊 Párrafos revisados: ${parrafosRevisados}, Correctos: ${parrafosCorrectos}`);

        return {
            correcto: errores.length === 0,
            correctos,
            errores
        };

    } catch (error) {
        console.error("❌ Error en analizarTamanoTexto:", error);
        return {
            correcto: false,
            mensaje: error.message,
            errores: [`Error al analizar tamaño de texto: ${error.message}`],
            correctos: []
        };
    }
}

module.exports = analizarTamanoTexto;