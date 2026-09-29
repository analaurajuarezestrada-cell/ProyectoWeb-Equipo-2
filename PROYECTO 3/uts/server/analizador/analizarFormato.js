const fs = require("fs");
const JSZip = require("jszip");
const levenshtein = require("fast-levenshtein");

// 🔥 FUNCIÓN: Palabras prohibidas
function esPalabraProhibida(texto) {
    const prohibidas = [
        "objetivo", "objetivos", "introducción", "introduccion",
        "conclusión", "conclusion", "conclusiones", "resultados", "resultado",
        "justificación", "justificacion", "metodología", "metodologia",
        "marco teórico", "marco teorico", "referencias", "bibliografía",
        "bibliografia", "anexos", "desarrollo", "agradecimientos"
    ];
    return prohibidas.some(p => texto.toLowerCase().trim() === p);
}

function esTituloImportante(texto) {
    const importantes = [
        "introducción", "introduccion",
        "objetivos",
        "justificación", "justificacion",
        "marco teórico", "marco teorico",
        "metodología", "metodologia",
        "resultados",
        "conclusiones", "conclusion",
        "referencias",
        "desarrollo",
        "i. introducción", "ii. desarrollo", "iii. conclusiones",
        "bibliografía", "anexos"
    ];
    return importantes.some(t => texto.toLowerCase().trim() === t);
}

// 🔥 FUNCIÓN: Resolver fuente del tema
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

// 🔥 FUNCIÓN MEJORADA: Busca fuente en texto, estilo y tema
function obtenerFuenteTitulo(parrafo, stylesXml, themeXml) {
    console.log("🔍 BUSCANDO FUENTE REAL...");
    
    const rFontsMatch = parrafo.match(/<w:rFonts\b[^>]*>/);
    if (rFontsMatch) {
        const rFonts = rFontsMatch[0];
        console.log("📌 rFonts encontrado en texto:", rFonts);
        
        const asciiMatch = rFonts.match(/w:ascii="([^"]+)"/);
        if (asciiMatch) {
            const fuente = asciiMatch[1];
            console.log("✅ Fuente ascii directa:", fuente);
            return fuente;
        }
        
        const hAnsiMatch = rFonts.match(/w:hAnsi="([^"]+)"/);
        if (hAnsiMatch) {
            const fuente = hAnsiMatch[1];
            console.log("✅ Fuente hAnsi directa:", fuente);
            return fuente;
        }
        
        const asciiThemeMatch = rFonts.match(/w:asciiTheme="([^"]+)"/);
        if (asciiThemeMatch) {
            const tema = asciiThemeMatch[1];
            console.log("🔍 Tema asciiTheme:", tema);
            const fuenteResuelta = resolverFuenteTema(tema, themeXml);
            if (fuenteResuelta) {
                console.log("✅ Fuente resuelta del tema:", fuenteResuelta);
                return fuenteResuelta;
            }
            return "theme:" + tema;
        }
        
        const hAnsiThemeMatch = rFonts.match(/w:hAnsiTheme="([^"]+)"/);
        if (hAnsiThemeMatch) {
            const tema = hAnsiThemeMatch[1];
            console.log("🔍 Tema hAnsiTheme:", tema);
            const fuenteResuelta = resolverFuenteTema(tema, themeXml);
            if (fuenteResuelta) {
                console.log("✅ Fuente resuelta del tema:", fuenteResuelta);
                return fuenteResuelta;
            }
            return "theme:" + tema;
        }
    }
    
    const estiloMatch = parrafo.match(/<w:pStyle\b[^>]*w:val="([^"]+)"/);
    if (estiloMatch) {
        const estiloId = estiloMatch[1];
        console.log("📌 Estilo del párrafo:", estiloId);
        
        const regex = new RegExp(`<w:style\\b[^>]*w:styleId="${estiloId}"[\\s\\S]*?<\\/w:style>`);
        const estiloXml = stylesXml.match(regex);
        if (estiloXml) {
            console.log("✅ Estilo encontrado:", estiloId);
            
            const rFontsEstilo = estiloXml[0].match(/<w:rFonts\b[^>]*>/);
            if (rFontsEstilo) {
                const rFonts = rFontsEstilo[0];
                console.log("📌 rFonts en estilo:", rFonts);
                
                const asciiMatch = rFonts.match(/w:ascii="([^"]+)"/);
                if (asciiMatch) {
                    const fuente = asciiMatch[1];
                    console.log("✅ Fuente del estilo (ascii):", fuente);
                    return fuente;
                }
                const hAnsiMatch = rFonts.match(/w:hAnsi="([^"]+)"/);
                if (hAnsiMatch) {
                    const fuente = hAnsiMatch[1];
                    console.log("✅ Fuente del estilo (hAnsi):", fuente);
                    return fuente;
                }
                const asciiThemeMatch = rFonts.match(/w:asciiTheme="([^"]+)"/);
                if (asciiThemeMatch) {
                    const tema = asciiThemeMatch[1];
                    const fuenteResuelta = resolverFuenteTema(tema, themeXml);
                    if (fuenteResuelta) {
                        console.log("✅ Fuente del estilo resuelta:", fuenteResuelta);
                        return fuenteResuelta;
                    }
                    return "theme:" + tema;
                }
                const hAnsiThemeMatch = rFonts.match(/w:hAnsiTheme="([^"]+)"/);
                if (hAnsiThemeMatch) {
                    const tema = hAnsiThemeMatch[1];
                    const fuenteResuelta = resolverFuenteTema(tema, themeXml);
                    if (fuenteResuelta) {
                        console.log("✅ Fuente del estilo resuelta:", fuenteResuelta);
                        return fuenteResuelta;
                    }
                    return "theme:" + tema;
                }
            }
            
            const basedOnMatch = estiloXml[0].match(/<w:basedOn\b[^>]*w:val="([^"]+)"/);
            if (basedOnMatch) {
                const basedOn = basedOnMatch[1];
                console.log("📌 Estilo hereda de:", basedOn);
                const regexBased = new RegExp(`<w:style\\b[^>]*w:styleId="${basedOn}"[\\s\\S]*?<\\/w:style>`);
                const basedOnXml = stylesXml.match(regexBased);
                if (basedOnXml) {
                    const rFontsBased = basedOnXml[0].match(/<w:rFonts\b[^>]*>/);
                    if (rFontsBased) {
                        const asciiMatch = rFontsBased[0].match(/w:ascii="([^"]+)"/);
                        if (asciiMatch) {
                            console.log("✅ Fuente del estilo base:", asciiMatch[1]);
                            return asciiMatch[1];
                        }
                    }
                }
            }
        }
    }
    
    const docDefaults = stylesXml.match(/<w:docDefaults[\s\S]*?<\/w:docDefaults>/);
    if (docDefaults) {
        const rFontsDefault = docDefaults[0].match(/<w:rFonts\b[^>]*>/);
        if (rFontsDefault) {
            const asciiMatch = rFontsDefault[0].match(/w:ascii="([^"]+)"/);
            if (asciiMatch) {
                console.log("✅ Fuente default:", asciiMatch[1]);
                return asciiMatch[1];
            }
        }
    }
    
    console.log("⚠️ NO se encontró fuente");
    return "NO_DETECTADA";
}

  // 🔥 FUNCIÓN: Obtener tamaño REAL del texto (BUSCA EN TODOS LADOS)
function obtenerTamanioParrafo(parrafo, stylesXml) {
    console.log("📏 BUSCANDO TAMAÑO DEL TEXTO...");
    
    // 🔥 1. BUSCAR EN <w:rPr> (propiedades del texto - CAMBIOS MANUALES)
    const rPrs = parrafo.match(/<w:rPr>[\s\S]*?<\/w:rPr>/g);
    if (rPrs) {
        for (const rPr of rPrs) {
            const szRPr = rPr.match(/<w:sz\b[^>]*w:val="([^"]+)"/);
            if (szRPr) {
                const tamanio = parseInt(szRPr[1]) / 2;
                console.log(`📏 Tamaño en <w:rPr>: ${tamanio} pt`);
                return tamanio; // 🔥 DEVOLVER EL TAMAÑO REAL
            }
        }
    }
    
    // 🔥 2. BUSCAR EN EL PÁRRAFO DIRECTO
    const szMatch = parrafo.match(/<w:sz\b[^>]*w:val="([^"]+)"/);
    if (szMatch) {
        const tamanio = parseInt(szMatch[1]) / 2;
        console.log(`📏 Tamaño en <w:sz>: ${tamanio} pt`);
        return tamanio; // 🔥 DEVOLVER EL TAMAÑO REAL
    }
    
    
    
    // 🔥 3. BUSCAR EN EL TEXTO DENTRO DE <w:r> - SOLO BUSCAR EL PRIMER RUN CON TEXTO
    const rTexts = parrafo.match(/<w:r>[\s\S]*?<\/w:r>/g);
    if (rTexts) {
        for (const r of rTexts) {
            const tieneTexto = /<w:t[^>]*>/.test(r);
            if (!tieneTexto) continue;
            
            const szMatch = r.match(/<w:sz\b[^>]*w:val="([^"]+)"/);
            if (szMatch) {
                const tamanio = parseInt(szMatch[1]) / 2;
                if (tamanio === 12) {
                    console.log(`📏 Tamaño en <w:r> con texto: ${tamanio} pt`);
                    return tamanio;
                } else {
                    console.log(`📏 Tamaño en <w:r> es ${tamanio} pt, ignorando porque no es 12pt`);
                }
            }
        }
    }
    
    // 🔥 4. BUSCAR EN EL ESTILO DEL PÁRRAFO (SOLO COMO FALLBACK)
    const estiloMatch = parrafo.match(/<w:pStyle\b[^>]*w:val="([^"]+)"/);
    if (estiloMatch) {
        const estiloId = estiloMatch[1];
        const regex = new RegExp(`<w:style\\b[^>]*w:styleId="${estiloId}"[\\s\\S]*?<\\/w:style>`);
        const estiloXml = stylesXml.match(regex);
        if (estiloXml) {
            const szEstilo = estiloXml[0].match(/<w:sz\b[^>]*w:val="([^"]+)"/);
            if (szEstilo) {
                const tamanio = parseInt(szEstilo[1]) / 2;
                console.log(`📏 Tamaño en estilo "${estiloId}": ${tamanio} pt (FALLBACK)`);
                if (tamanio === 12) {
                    return tamanio;
                }
            }
        }
    }
    
    // 🔥 5. BUSCAR EN docDefaults
    const docDefaults = stylesXml.match(/<w:docDefaults[\s\S]*?<\/w:docDefaults>/);
    if (docDefaults) {
        const szDefault = docDefaults[0].match(/<w:sz\b[^>]*w:val="([^"]+)"/);
        if (szDefault) {
            const tamanio = parseInt(szDefault[1]) / 2;
            console.log(`📏 Tamaño en docDefaults: ${tamanio} pt (FALLBACK)`);
            if (tamanio === 12) {
                return tamanio;
            }
        }
    }
    
    console.log(`📏 NO se encontró tamaño 12pt, usando 12 pt por defecto`);
    return 12;
}

// 🔥 VALIDAR FORMATO DE TÍTULOS PRINCIPALES
function validarFormatoTitulo(
    parrafo,
    seccion,
    errores,
    correctos,
    stylesXml,
    themeXml
) {

    console.log("====================================");
    console.log("📝 TÍTULO PRINCIPAL:", seccion);

    // 🔥 VALIDAR QUE ESTÉ EN MAYÚSCULAS
    const estaEnMayusculas = seccion === seccion.toUpperCase();
    
    // 🔥 VERIFICAR SI ESTÁ MAL ESCRITO (para títulos conocidos)
    const titulosCorrectos = [
        "I. INTRODUCCIÓN",
        "II. DESARROLLO",
        "III. CONCLUSIONES Y RECOMENDACIONES",
        "BIBLIOGRAFÍA",
        "ANEXOS"
    ];
    
    let esCorrecto = false;
    let tituloCorrecto = "";
    
    titulosCorrectos.forEach(titulo => {
        const distancia = levenshtein.get(seccion.toUpperCase(), titulo.toUpperCase());
        if (distancia <= 2 && seccion !== titulo) {
            // Está mal escrito
            esCorrecto = false;
            tituloCorrecto = titulo;
        }
        if (seccion === titulo) {
            esCorrecto = true;
            tituloCorrecto = titulo;
        }
    });

    const tieneNegrita = /<w:b(\s*\/>|[^>]*w:val="1")/.test(parrafo);
    const tieneTamanio = parrafo.includes('w:sz w:val="28"');
    const estaCentrado = parrafo.includes('w:jc w:val="center"');

    const fuenteTitulo = obtenerFuenteTitulo(parrafo, stylesXml, themeXml);
    const fuenteNormalizada = fuenteTitulo ? fuenteTitulo.toLowerCase().trim() : "";

    let esArial = false;
    const fuentesArial = ["arial", "arialmt", "arial narrow", "arialnarrow", "arial black", "arialblack", "helvetica"];
    
    if (fuenteNormalizada !== "no_detectada" && fuenteNormalizada !== "desconocida") {
        for (const fuenteValida of fuentesArial) {
            if (fuenteNormalizada === fuenteValida || fuenteNormalizada.includes(fuenteValida)) {
                esArial = true;
                break;
            }
        }
    }
    
    if (fuenteNormalizada.startsWith("theme:")) {
        const tema = fuenteNormalizada.replace("theme:", "");
        const fuenteResuelta = resolverFuenteTema(tema, themeXml);
        if (fuenteResuelta) {
            const fuenteResueltaNorm = fuenteResuelta.toLowerCase().trim();
            for (const fuenteValida of fuentesArial) {
                if (fuenteResueltaNorm === fuenteValida || fuenteResueltaNorm.includes(fuenteValida)) {
                    esArial = true;
                    break;
                }
            }
        }
        if (!esArial && (tema === "minorHAnsi" || tema === "majorHAnsi" || tema === "minorAscii" || tema === "majorAscii")) {
            esArial = true;
        }
    }

    if (fuenteNormalizada === "no_detectada" || fuenteNormalizada === "desconocida") {
        esArial = true;
    }

    console.log("🔤 FUENTE DETECTADA:", fuenteTitulo);
    console.log("✅ NEGRITAS:", tieneNegrita);
    console.log("✅ TAMAÑO 14pt:", tieneTamanio);
    console.log("✅ CENTRADO:", estaCentrado);
    console.log("✅ ARIAL:", esArial);
    console.log("✅ MAYÚSCULAS:", estaEnMayusculas);
    console.log("====================================");

    let erroresTitulo = [];
    let aciertosTitulo = [];

    // 🔥 VALIDAR ESCRITURA Y MAYÚSCULAS (primero)
    if (!esCorrecto && tituloCorrecto) {
        erroresTitulo.push(`debe escribirse correctamente como "${tituloCorrecto}" y en MAYÚSCULAS`);
    } else if (!estaEnMayusculas && esCorrecto) {
        erroresTitulo.push(`debe estar en MAYÚSCULAS (actual: "${seccion}")`);
    }

    if (tieneNegrita) {
        aciertosTitulo.push("está en negritas");
    } else {
        erroresTitulo.push("debe estar en negritas");
    }

    if (tieneTamanio) {
        aciertosTitulo.push("tiene tamaño 14 pt");
    } else {
        erroresTitulo.push("debe tener tamaño 14 pt");
    }

    if (estaCentrado) {
        aciertosTitulo.push("está centrado");
    } else {
        erroresTitulo.push("debe estar centrado");
    }

    if (esArial) {
        const fuenteMostrar = fuenteTitulo || 'Arial';
        if (fuenteMostrar !== "NO_DETECTADA" && fuenteMostrar !== "Desconocida") {
            aciertosTitulo.push(`utiliza Arial (fuente: ${fuenteMostrar})`);
        } else {
            aciertosTitulo.push(`utiliza Arial`);
        }
    } else {
        erroresTitulo.push(`debe utilizar Arial (fuente actual: "${fuenteTitulo || 'NO DETECTADA'}")`);
    }

    if (aciertosTitulo.length > 0) {
        correctos.push(`✅ El título "${seccion}" ${aciertosTitulo.join(", ")}.`);
    }

   if (erroresTitulo.length > 0) {
    const errorExistente = errores.find(e => e.buscar === seccion);
    if (!errorExistente) {
        // 🔥 CONSTRUIR MENSAJE CON FORMATO PROFESIONAL
        let mensajeFinal = `❌ TÍTULO: "${seccion}"`;
        
        if (erroresTitulo.length <= 2) {
            mensajeFinal += ` → ${erroresTitulo.join("; ")}`;
        } else {
            const listaErrores = erroresTitulo.map(e => `• ${e}`).join("\n   ");
            mensajeFinal += `\n   ${listaErrores}`;
        }
        
        errores.push({
            tipo: "formato",
            buscar: seccion,
            mensaje: mensajeFinal
        });
    }
}
}

// 🔥 VALIDAR FORMATO DE SUBTÍTULOS
function validarFormatoSubtitulo(
    parrafo,
    subtitulo,
    errores,
    correctos,
    stylesXml,
    themeXml
) {
    console.log("====================================");
    console.log("📝 SUBTÍTULO:", subtitulo);

    // 🔥 VERIFICAR QUE NO SEA UN TÍTULO PRINCIPAL
    if (/^[IVXLCDM]+\.\s/.test(subtitulo)) {
        console.log(`⚠️ "${subtitulo}" es un título principal, no un subtítulo`);
        return; // Salir sin validar
    }


    // 🔥 VALIDACIONES DE SUBTÍTULO SEGÚN UNI
    const tieneNegrita = /<w:b(\s*\/>|[^>]*w:val="1")/.test(parrafo);
    const tamanio = obtenerTamanioParrafo(parrafo, stylesXml);
    depurarTamanios(parrafo, subtitulo);
    
    // 🔥 CORRECCIÓN: Verificar si el tamaño es 12pt (tolerancia de 0.5pt)
    const tieneTamanio12 = Math.abs(tamanio - 12) < 0.5;
    
    // 🔥 DETECTAR ALINEACIÓN
    const estaCentrado = parrafo.includes('w:jc w:val="center"');
    const estaJustificado = parrafo.includes('w:jc w:val="both"');
    const estaAlineadoIzquierda = !estaCentrado && !estaJustificado;
    
    const fuenteSubtitulo = obtenerFuenteTitulo(parrafo, stylesXml, themeXml);
    const fuenteNormalizada = fuenteSubtitulo ? fuenteSubtitulo.toLowerCase().trim() : "";

    // 🔥 DETECTAR ARIAL
    let esArial = false;
    const fuentesArial = ["arial", "arialmt", "arial narrow", "arialnarrow", "arial black", "arialblack", "helvetica"];
    
    if (fuenteNormalizada !== "no_detectada" && fuenteNormalizada !== "desconocida") {
        for (const fuenteValida of fuentesArial) {
            if (fuenteNormalizada === fuenteValida || fuenteNormalizada.includes(fuenteValida)) {
                esArial = true;
                break;
            }
        }
    }
    
    if (fuenteNormalizada.startsWith("theme:")) {
        const tema = fuenteNormalizada.replace("theme:", "");
        const fuenteResuelta = resolverFuenteTema(tema, themeXml);
        if (fuenteResuelta) {
            const fuenteResueltaNorm = fuenteResuelta.toLowerCase().trim();
            for (const fuenteValida of fuentesArial) {
                if (fuenteResueltaNorm === fuenteValida || fuenteResueltaNorm.includes(fuenteValida)) {
                    esArial = true;
                    break;
                }
            }
        }
        if (!esArial && (tema === "minorHAnsi" || tema === "majorHAnsi" || tema === "minorAscii" || tema === "majorAscii")) {
            esArial = true;
        }
    }

    if (fuenteNormalizada === "no_detectada" || fuenteNormalizada === "desconocida") {
        esArial = true;
    }

    // 🔥 EXTRAER TEXTO DEL PÁRRAFO (CONSERVANDO ESPACIOS)
const texto = [...parrafo.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map(t => t[1])
    .join("")
    .trim();
    
    // 🔥 Limpiar el número para validar solo el texto
let textoSinNumero = texto;

// 🔥 ELIMINAR NÚMEROS DE SUBTÍTULOS (I.1, I.1.1, I.1.1.1, etc.)
// Usar un patrón más robusto que elimine TODO el número y el espacio
textoSinNumero = textoSinNumero.replace(/^[IVXLCDM]+\.\d+(\.\d+)*\s*/, '');
textoSinNumero = textoSinNumero.replace(/^\d+\.\d+(\.\d+)*\s*/, '');

// 🔥 También eliminar números que puedan quedar al inicio (como "1. ")
textoSinNumero = textoSinNumero.replace(/^\d+\.\s*/, '');
textoSinNumero = textoSinNumero.replace(/^\d+\.\d+\.\s*/, '');



textoSinNumero = textoSinNumero.replace(/^[•\-*]\s*/, '');
// 🔥 Solo eliminar "Objetivos" si es EXACTAMENTE "Objetivos" al inicio
// Y NO eliminar si es "Objetivos de la Empresa" (porque es un subtítulo válido)
textoSinNumero = textoSinNumero.replace(/^Objetivos Generales\s*/, '');
textoSinNumero = textoSinNumero.replace(/^Objetivos Específicos\s*/, '');
// Ya no eliminamos "Objetivos" solo
textoSinNumero = textoSinNumero.replace(/^Conclusiones\s*/, '');
textoSinNumero = textoSinNumero.replace(/^Recomendaciones\s*/, '');


    
    const primeraLetra = textoSinNumero.charAt(0);
const restoTexto = textoSinNumero.slice(1);

const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(textoSinNumero);
let primeraMayuscula = false;
let restoMinusculas = false;

if (tieneLetras && primeraLetra) {
    // 🔥 Comparar directamente SIN normalizar (para mantener los acentos)
    primeraMayuscula = primeraLetra === primeraLetra.toUpperCase();
    
    // 🔥 Verificar que el resto esté en minúsculas (incluyendo acentos)
    const restoMinusculasCheck = restoTexto.toLowerCase();
    restoMinusculas = restoTexto === restoMinusculasCheck;
}

    console.log("🔤 TEXTO ORIGINAL:", texto);
    console.log("🔤 TEXTO SIN NÚMERO:", textoSinNumero);
    console.log("🔤 PRIMERA LETRA:", primeraLetra, "¿Mayúscula?", primeraMayuscula);
    console.log("🔤 RESTO:", restoTexto, "¿Minúsculas?", restoMinusculas);
    console.log("✅ NEGRITAS:", tieneNegrita);
    console.log("✅ TAMAÑO 12pt:", tieneTamanio12, "(valor:", tamanio, "pt)");
    console.log("✅ ALINEACIÓN IZQUIERDA:", estaAlineadoIzquierda);
    console.log("✅ ARIAL:", esArial);
    console.log("====================================");

    let erroresSubtitulo = [];
    let aciertosSubtitulo = [];

const subtitulosCorrectos = [
    "I.1 Conceptualización de la estadía",
    "I.2 Contextualización",
    "I.2.1 Localización geográfica de la empresa",
    "I.2.2 Giro y tamaño de la empresa",
    "I.2.3 Área de influencia",
    "I.2.4 Objetivos de la empresa",
    "II.1 Marco referencial",
    "II.1.1 Microeconomía de la empresa",
    "II.1.2 Motivo de estudio",
    "II.1.3 Desarrollo del Objetivo",  // ← Cambiado: "Objetivo" con mayúscula
    "II.2 Estado del Arte",  // ← Se mantiene igual
    "II.3 Materiales y métodos",
    "II.4 Procesamiento de resultados, análisis y discusión"
];

let ortografiaCorrecta = true;
let subtituloCorrecto = "";

// 🔥 Buscar si el subtítulo actual coincide con algún subtítulo correcto (con tolerancia)
for (const correcto of subtitulosCorrectos) {
    const distancia = levenshtein.get(texto.toUpperCase(), correcto.toUpperCase());
    if (distancia <= 2 && texto !== correcto) {
        // Está mal escrito (distancia pequeña pero no exacto)
        ortografiaCorrecta = false;
        subtituloCorrecto = correcto;
        break;
    }
    if (texto === correcto) {
        ortografiaCorrecta = true;
        subtituloCorrecto = correcto;
        break;
    }
}

// 🔥 Si el subtítulo está mal escrito, agregar error
if (!ortografiaCorrecta && subtituloCorrecto) {
    erroresSubtitulo.push(`debe escribirse correctamente como "${subtituloCorrecto}"`);
}

    // 🔥 VALIDAR NEGRITAS
    if (tieneNegrita) {
        aciertosSubtitulo.push("está en negritas");
    } else {
        erroresSubtitulo.push("debe estar en negritas");
    }

    // 🔥 VALIDAR TAMAÑO 12 (con tolerancia)
    if (tieneTamanio12) {
        aciertosSubtitulo.push(`tiene tamaño 12 pt (${tamanio} pt)`);
    } else {
        const tamanioMostrar = tamanio || 'no definido';
        erroresSubtitulo.push(`debe tener tamaño 12 pt (actual: ${tamanioMostrar} pt)`);
    }

    // 🔥 VALIDAR ALINEACIÓN IZQUIERDA
    if (estaAlineadoIzquierda) {
        aciertosSubtitulo.push("está alineado a la izquierda");
    } else if (estaCentrado) {
        erroresSubtitulo.push("debe estar alineado a la izquierda (actual: centrado)");
    } else if (estaJustificado) {
        erroresSubtitulo.push("debe estar alineado a la izquierda (actual: justificado)");
    }

    // 🔥 VALIDAR ARIAL
    if (esArial) {
        const fuenteMostrar = fuenteSubtitulo || 'Arial';
        if (fuenteMostrar !== "NO_DETECTADA" && fuenteMostrar !== "Desconocida") {
            aciertosSubtitulo.push(`utiliza Arial (fuente: ${fuenteMostrar})`);
        } else {
            aciertosSubtitulo.push(`utiliza Arial`);
        }
    } else {
        erroresSubtitulo.push(`debe utilizar Arial (fuente actual: "${fuenteSubtitulo || 'NO DETECTADA'}")`);
    }

    // 🔥 VALIDAR PRIMERA LETRA MAYÚSCULA Y RESTO MINÚSCULAS
   // 🔥 VALIDAR PRIMERA LETRA MAYÚSCULA Y RESTO MINÚSCULAS (CON EXCEPCIONES)
if (tieneLetras) {
    // 🔥 EXCEPCIONES: subtítulos que pueden tener mayúsculas adicionales
    const excepciones = [
        "DESARROLLO DEL OBJETIVO",
        "ESTADO DEL ARTE"
    ];
    
    const textoUpper = textoSinNumero.toUpperCase().trim();
    const esExcepcion = excepciones.some(exc => textoUpper === exc);
    
    if (esExcepcion) {
        // Para excepciones, validar que coincidan exactamente con su forma correcta
        let esCorrecto = false;
        if (textoUpper === "DESARROLLO DEL OBJETIVO") {
            esCorrecto = textoSinNumero === "Desarrollo del Objetivo";
        } else if (textoUpper === "ESTADO DEL ARTE") {
            esCorrecto = textoSinNumero === "Estado del Arte";
        }
        
        if (esCorrecto) {
            aciertosSubtitulo.push(`tiene formato correcto (excepción permitida)`);
        } else {
            // Mostrar el formato correcto esperado
            const esperado = textoUpper === "DESARROLLO DEL OBJETIVO" ? "Desarrollo del Objetivo" : "Estado del Arte";
            erroresSubtitulo.push(`debe escribirse como "${esperado}" (formato especial)`);
        }
    } else {
        // Validación normal para subtítulos que NO son excepción
        if (primeraMayuscula && restoMinusculas) {
            aciertosSubtitulo.push(`tiene formato correcto (primera mayúscula, resto minúsculas)`);
        } else if (!primeraMayuscula) {
            erroresSubtitulo.push(`la primera letra debe ser mayúscula (actual: "${primeraLetra}")`);
        } else if (!restoMinusculas) {
            // 🔥 Encontrar la primera letra mayúscula en el resto
            const letrasMayusculas = restoTexto.match(/[A-ZÁÉÍÓÚ]/g);
            const letrasMostrar = letrasMayusculas ? letrasMayusculas.join(', ') : restoTexto;
            erroresSubtitulo.push(`el resto debe estar en minúsculas (tiene mayúsculas en: "${letrasMostrar}")`);
        }
    }
}

    if (aciertosSubtitulo.length > 0) {
        correctos.push(`✅ El subtítulo "${subtitulo}" ${aciertosSubtitulo.join(", ")}.`);
    }

  if (erroresSubtitulo.length > 0) {
    const errorExistente = errores.find(e => e.buscar === subtitulo);
    if (!errorExistente) {
        // 🔥 FILTRAR ERRORES DUPLICADOS
        const erroresUnicos = [...new Set(erroresSubtitulo)];
        
        // 🔥 SEPARAR ERRORES: ORTOGRAFÍA vs OTROS
        const errorOrtografia = erroresUnicos.find(e => e.includes("debe escribirse correctamente"));
        const otrosErrores = erroresUnicos.filter(e => !e.includes("debe escribirse correctamente"));
        
        // 🔥 DETECTAR EL TIPO CORRECTO: SUBTÍTULO o SUBSUBTÍTULO
        const esSubsubtitulo = /^[IVXLCDM]+\.\d+\.\d+/.test(subtitulo);
        const tipoTexto = esSubsubtitulo ? "subsubtítulo" : "subtítulo";
        
        let mensajeFinal = "";
        
        // 🔥 CONSTRUIR MENSAJE CON FORMATO: "El subtítulo 'texto' → ..."
        mensajeFinal = `El ${tipoTexto} "${subtitulo}"`;
        
        if (errorOrtografia) {
            // Extraer el texto correcto del mensaje
            const match = errorOrtografia.match(/como "([^"]+)"/);
            const textoCorrecto = match ? match[1] : '';
            mensajeFinal += ` → Debe escribirse correctamente como "${textoCorrecto}"`;
        }
        
        // Agregar otros errores si existen (negritas, tamaño, alineación, mayúsculas, etc.)
        if (otrosErrores.length > 0) {
            // Unir otros errores con " → " si hay uno, o con " → " y luego viñetas si hay varios
            if (otrosErrores.length === 1) {
                mensajeFinal += ` → ${otrosErrores[0]}`;
            } else if (otrosErrores.length <= 3) {
                mensajeFinal += ` → ${otrosErrores.join(" → ")}`;
            } else {
                mensajeFinal += ` → ${otrosErrores.map(e => `• ${e}`).join(" → ")}`;
            }
        }
        
        // Si no hay ningún error (por seguridad)
        if (!errorOrtografia && otrosErrores.length === 0) {
            mensajeFinal += ` → tiene errores de formato`;
        }
        
        errores.push({
            tipo: "formato_subtitulo",
            buscar: subtitulo,
            mensaje: mensajeFinal
        });
    }
}
}

async function analizarFormato(rutaArchivo) {
    console.log("🔥 ANALIZARFORMATO.JS SE ESTÁ EJECUTANDO 🔥");
    
    try {
        const buffer = fs.readFileSync(rutaArchivo);
        const zip = await JSZip.loadAsync(buffer);

        const documentXml = await zip.file("word/document.xml").async("string");
        const stylesXml = await zip.file("word/styles.xml").async("string");
        const settingsXml = await zip.file("word/settings.xml").async("string");
        const themeXml = await zip.file("word/theme/theme1.xml").async("string");

        let correctos = [];
        let errores = [];

        console.log("Documento abierto correctamente.");
        console.log("document.xml:", !!documentXml);
        console.log("styles.xml:", !!stylesXml);
        console.log("settings.xml:", !!settingsXml);
        console.log("theme.xml:", !!themeXml);

              // 🔥 SEPARAR EN BLOQUES PARA DETECTAR LEYENDAS DE TABLA (título superior y fuente inferior)
const bloquesFormato = documentXml.match(/<w:tbl\b[\s\S]*?<\/w:tbl>|<w:p[\s\S]*?<\/w:p>/g) || [];

// 🔥 DETECTAR PÁRRAFOS QUE SON LEYENDAS DE TABLA POR POSICIÓN
const textosLeyendasDeTabla = new Set();

for (let i = 0; i < bloquesFormato.length; i++) {
    const bloque = bloquesFormato[i];
    if (bloque.startsWith('<w:tbl')) {
        // Párrafo anterior = TÍTULO de la tabla
        if (i > 0 && bloquesFormato[i - 1].startsWith('<w:p')) {
            const textoLeyenda = [...bloquesFormato[i - 1].matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)]
                .map(x => x[1]).join("").trim();
            if (textoLeyenda.length > 0) {
                textosLeyendasDeTabla.add(textoLeyenda);
            }
        }
        // Párrafo siguiente = FUENTE de la tabla
        if (i < bloquesFormato.length - 1 && bloquesFormato[i + 1].startsWith('<w:p')) {
            const textoLeyenda = [...bloquesFormato[i + 1].matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)]
                .map(x => x[1]).join("").trim();
            if (textoLeyenda.length > 0) {
                textosLeyendasDeTabla.add(textoLeyenda);
            }
        }
    }
}

console.log(`📊 Leyendas de tabla (formato) detectadas: ${textosLeyendasDeTabla.size}`);

const parrafos = documentXml.split("<w:p");

parrafos.forEach(parrafo => {
    let textoParrafo = [...parrafo.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)]
        .map(x => x[1])
        .join("")
        .trim();

    // 🔥 SI ESTE PÁRRAFO ES UNA LEYENDA DE TABLA, NO VALIDAR COMO TÍTULO NI SUBTÍTULO
    if (textoParrafo && textosLeyendasDeTabla.has(textoParrafo)) {
        console.log("📄 PARRAFO LEIDO:", textoParrafo, "⏭️ ES LEYENDA DE TABLA - SE OMITE VALIDACIÓN");
        return; // 🔥 SALIR, no procesar como título/subtítulo
    }

    console.log("📄 PARRAFO LEIDO:", textoParrafo);

    const esPalabraProhibidaTexto = textoParrafo && esPalabraProhibida(textoParrafo);

  // 🔥🔥🔥 DETECCIÓN FORZADA PARA BIBLIOGRAFÍA Y ANEXOS (SIN IMPORTAR MAYÚSCULAS/MINÚSCULAS)
if (textoParrafo && (
    textoParrafo.trim().toLowerCase() === "bibliografía" ||
    textoParrafo.trim().toLowerCase() === "bibliografia" ||
    textoParrafo.trim().toLowerCase() === "anexos" ||
    textoParrafo.trim().toLowerCase() === "anexo"
)) {
    console.log("🎯🎯🎯 TITULO ESPECIAL DETECTADO (FORZADO):", textoParrafo);
    
    // Normalizar el título a mayúsculas con acento correcto
    let tituloNormalizado = "BIBLIOGRAFÍA";
    if (textoParrafo.trim().toLowerCase() === "anexos" || textoParrafo.trim().toLowerCase() === "anexo") {
        tituloNormalizado = "ANEXOS";
    }
    
    validarFormatoTitulo(
        parrafo,
        tituloNormalizado, // Usar el título normalizado
        errores,
        correctos,
        stylesXml,
        themeXml
    );
    return; // Salir para no procesar como subtítulo
}

// 🔥 PRIMERO: Detectar TÍTULOS PRINCIPALES (I., II., III., etc.)
const esTituloPrincipal = 
    textoParrafo &&
    textoParrafo.length <= 80 &&
    !esPalabraProhibidaTexto &&
    (
        // Títulos con números romanos (I., II., III., etc.)
        /^[IVXLCDM]+\.\s/.test(textoParrafo) ||
        // 🔥 CUALQUIER TEXTO QUE ESTÉ COMPLETAMENTE EN MAYÚSCULAS Y TENGA MÁS DE 4 LETRAS
        (textoParrafo === textoParrafo.toUpperCase() && 
         textoParrafo.length > 4 && 
         !/[0-9]/.test(textoParrafo) &&
         !/^(I\.|II\.|III\.|IV\.|V\.|VI\.|VII\.|VIII\.|IX\.|X\.)/.test(textoParrafo) &&
         // Excluir palabras comunes que no son títulos
         !/^(RESUMEN|ABSTRACT|ÍNDICE|INDICE|TABLA|FIGURA|PÁGINA|PAGINA)$/.test(textoParrafo))
    );

// 🔥 SEGUNDO: Detectar SUBTÍTULOS NIVEL 1 (I.1, I.2, II.1, etc.)
const esSubtituloNivel1 = 
    textoParrafo &&
    textoParrafo.length <= 80 &&
    /^[IVXLCDM]+\.\d+\s/.test(textoParrafo) && // Empieza con I.1, II.1, etc.
    !/^[IVXLCDM]+\.\d+\.\d+/.test(textoParrafo) && // NO es nivel 2 (I.1.1)
    !esPalabraProhibidaTexto;

    // 🔥 NUEVO: Detectar títulos de tablas, gráficas, figuras e ilustraciones
// Esto evita que se confundan con subtítulos
const esTituloDeTablaOFigura = 
    textoParrafo &&
    /^(tabla|gráfica|grafica|figura|ilustración|ilustracion)\s+\d+/i.test(textoParrafo.trim());

// 🔥 TERCERO: Detectar SUBSUBTÍTULOS NIVEL 2 (I.1.1, I.2.1, II.1.1, etc.)
const esSubtituloNivel2 = 
    textoParrafo &&
    textoParrafo.length <= 80 &&
    /^[IVXLCDM]+\.\d+\.\d+/.test(textoParrafo) && // Empieza con I.1.1, II.1.1, etc.
    !esPalabraProhibidaTexto;

// 🔥 Validar TÍTULO PRINCIPAL
if (esTituloPrincipal) {
    console.log("🎯 TITULO PRINCIPAL DETECTADO:", textoParrafo);
    
    validarFormatoTitulo(
        parrafo,
        textoParrafo,
        errores,
        correctos,
        stylesXml,
        themeXml
    );
    return; // IMPORTANTE: Salir para no procesar como subtítulo
}

    // 🔥 Validar SUBTÍTULO NIVEL 1 (I.1, II.1, etc.)
    if (esSubtituloNivel1) {
        console.log("🎯 SUBTITULO NIVEL 1 DETECTADO:", textoParrafo);
        
        validarFormatoSubtitulo(
            parrafo,
            textoParrafo,
            errores,
            correctos,
            stylesXml,
            themeXml
        );
        return; // IMPORTANTE: Salir para no procesar como nivel 2
    }

    // 🔥 Validar SUBSUBTÍTULO NIVEL 2 (I.1.1, II.1.1, etc.)
    if (esSubtituloNivel2) {
        console.log("🎯 SUBSUBTITULO NIVEL 2 DETECTADO:", textoParrafo);
        
        validarFormatoSubtitulo(
            parrafo,
            textoParrafo,
            errores,
            correctos,
            stylesXml,
            themeXml
        );
        return;
    }
});

        const erroresUnicos = [];
        const titulosVistos = new Set();
        errores.forEach(error => {
            if (!titulosVistos.has(error.buscar)) {
                titulosVistos.add(error.buscar);
                erroresUnicos.push(error);
            }
        });
        errores = erroresUnicos;

        console.log({ correcto: true, correctos, errores });
        
        return { correcto: true, correctos, errores };

    } catch (error) {
        console.error(error);
        return { correcto: false, mensaje: error.message };
    }
}

// 🔥 FUNCIÓN DE DEPURACIÓN - MUESTRA TODOS LOS TAMAÑOS ENCONTRADOS
function depurarTamanios(parrafo, subtitulo) {
    console.log(`\n🔍🔍🔍 DEPURANDO: "${subtitulo}"`);
    
    const todosLosSz = parrafo.match(/<w:sz[^>]*>/g);
    if (todosLosSz) {
        console.log("📏 TODOS los tags <w:sz> encontrados:");
        todosLosSz.forEach((tag, i) => {
            const val = tag.match(/w:val="([^"]+)"/);
            if (val) {
                const tamanio = parseInt(val[1]) / 2;
                console.log(`   ${i+1}. ${tag} → ${tamanio} pt`);
            } else {
                console.log(`   ${i+1}. ${tag} → SIN VALOR`);
            }
        });
    } else {
        console.log("   ❌ No se encontraron tags <w:sz>");
    }
    
    const runsConTexto = parrafo.match(/<w:r>[\s\S]*?<w:t[^>]*>[\s\S]*?<\/w:t>[\s\S]*?<\/w:r>/g);
    if (runsConTexto) {
        console.log("📏 RUNS CON TEXTO:");
        runsConTexto.forEach((run, i) => {
            const texto = run.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/);
            const sz = run.match(/<w:sz[^>]*>/);
            if (sz) {
                const val = sz[0].match(/w:val="([^"]+)"/);
                if (val) {
                    const tamanio = parseInt(val[1]) / 2;
                    console.log(`   Run ${i+1}: "${texto ? texto[1].substring(0, 20) : ''}" → ${tamanio} pt`);
                }
            }
        });
    }
    
    console.log("🔍🔍🔍 FIN DEPURACIÓN\n");
}

module.exports = analizarFormato;