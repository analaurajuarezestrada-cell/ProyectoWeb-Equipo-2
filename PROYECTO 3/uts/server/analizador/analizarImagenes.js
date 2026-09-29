// analizarImagenes.js
const fs = require("fs");
const JSZip = require("jszip");
const levenshtein = require("fast-levenshtein");

// 🔥 TIPOS DE LEYENDAS PERMITIDAS
const TIPOS_LEYENDA = ["Figura", "Gráfica", "Ilustración", "Grafico", "Gráfico", "Imagen", "Tabla"];

// 🔥 FUNCIÓN: Extraer texto limpio de un párrafo
function extraerTextoParrafo(parrafo) {
    const textos = [...parrafo.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
        .map(t => t[1])
        .join("");
    return textos.trim();
}

// 🔥 FUNCIÓN: Verificar si un párrafo contiene una imagen
function parrafoTieneImagen(parrafo) {
    if (/<w:drawing\b/.test(parrafo)) return true;
    if (/<w:pict\b/.test(parrafo)) return true;
    if (/<w:object\b/.test(parrafo)) return true;
    if (/<v:shape\b/.test(parrafo)) return true;
    if (/<a:blip\b/.test(parrafo)) return true;
    return false;
}

// 🔥 FUNCIÓN: Verificar si un párrafo está vacío (solo espacios)
function parrafoEstaVacio(parrafo) {
    const texto = extraerTextoParrafo(parrafo);
    const tieneImagen = parrafoTieneImagen(parrafo);
    return texto.length === 0 && !tieneImagen;
}

// 🔥 FUNCIÓN: Detectar si un texto es una leyenda válida
function esLeyendaValida(texto) {
    if (!texto) return { valido: false, tipo: null, numero: null };
    
    const textoLimpio = texto.trim();
    if (textoLimpio.length === 0 || textoLimpio.length > 200) {
        return { valido: false, tipo: null, numero: null };
    }
    
    const tiposRegex = TIPOS_LEYENDA.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    const patronPrincipal = new RegExp(
        `^(${tiposRegex})\\s+(\\d+(?:\\.\\d+)*)\\s*[:.\\-–—]?\\s*(.*)$`,
        'i'
    );
    
    const match = textoLimpio.match(patronPrincipal);
    if (match) {
        return {
            valido: true,
            tipo: match[1],
            numero: match[2],
            descripcion: match[3] || "",
            textoCompleto: textoLimpio
        };
    }
    
    const patronSimple = new RegExp(
        `^(${tiposRegex})\\s+(\\d+(?:\\.\\d+)*)\\s*$`,
        'i'
    );
    
    const matchSimple = textoLimpio.match(patronSimple);
    if (matchSimple) {
        return {
            valido: true,
            tipo: matchSimple[1],
            numero: matchSimple[2],
            descripcion: "",
            textoCompleto: textoLimpio
        };
    }
    
    const primerPalabra = textoLimpio.split(/\s+/)[0];
    for (const tipo of TIPOS_LEYENDA) {
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
    
    if (/^[A-ZÁÉÍÓÚ]/.test(textoLimpio) && textoLimpio.length < 100) {
        for (const tipo of TIPOS_LEYENDA) {
            if (textoLimpio.toLowerCase().startsWith(tipo.toLowerCase())) {
                return {
                    valido: false,
                    tipoSugerido: tipo,
                    textoOriginal: textoLimpio,
                    errorFormato: true
                };
            }
        }
    }
    
    return { valido: false, tipo: null, numero: null };
}

// 🔥 FUNCIÓN PRINCIPAL
async function analizarImagenes(rutaArchivo) {
    console.log("🔥 ANALIZARIMAGENES.JS SE ESTÁ EJECUTANDO 🔥");
    
    try {
        const buffer = fs.readFileSync(rutaArchivo);
        const zip = await JSZip.loadAsync(buffer);
        
        const documentXml = await zip.file("word/document.xml").async("string");
        
        if (!documentXml) {
            return { correcto: false, mensaje: "No se pudo leer document.xml" };
        }
        
        let correctos = [];
        let errores = [];
        
        const partes = documentXml.split(/(<w:p\b[\s\S]*?<\/w:p>)/);
        
        const parrafos = [];
        let indiceGlobal = 0;
        
        for (const parte of partes) {
            if (parte.startsWith('<w:p ') || parte.startsWith('<w:p>')) {
                parrafos.push({
                    xml: parte,
                    indice: indiceGlobal++,
                    texto: extraerTextoParrafo(parte),
                    tieneImagen: parrafoTieneImagen(parte),
                    estaVacio: parrafoEstaVacio(parte)
                });
            }
        }
        
        console.log(`📄 Total de párrafos analizados: ${parrafos.length}`);
        
        let totalImagenes = 0;
        let imagenesConLeyenda = 0;
        let imagenesSinLeyenda = 0;
        
        for (let i = 0; i < parrafos.length; i++) {
            const parrafo = parrafos[i];
            
            if (!parrafo.tieneImagen) continue;
            
            totalImagenes++;
            
            console.log(`\n🖼️ IMAGEN DETECTADA en párrafo ${i}`);
            
            let leyendaEncontrada = null;
            
            const textoMismoParrafo = parrafo.texto;
            if (textoMismoParrafo && textoMismoParrafo.length > 0) {
                const resultado = esLeyendaValida(textoMismoParrafo);
                if (resultado.valido) {
                    leyendaEncontrada = resultado;
                    console.log(`   ✅ Leyenda encontrada en el MISMO párrafo: "${resultado.textoCompleto}"`);
                }
            }
            
            if (!leyendaEncontrada) {
                for (let j = i + 1; j < Math.min(i + 4, parrafos.length); j++) {
                    const siguienteParrafo = parrafos[j];
                    
                    if (siguienteParrafo.tieneImagen) {
                        console.log(`   ⚠️ Se encontró otra imagen antes que la leyenda`);
                        break;
                    }
                    
                    if (siguienteParrafo.estaVacio) {
                        continue;
                    }
                    
                    if (siguienteParrafo.texto && siguienteParrafo.texto.length > 0) {
                        const resultado = esLeyendaValida(siguienteParrafo.texto);
                        
                        if (resultado.valido) {
                            leyendaEncontrada = resultado;
                            console.log(`   ✅ Leyenda encontrada en párrafo ${j}: "${resultado.textoCompleto}"`);
                        } else {
                            console.log(`   ❌ El párrafo ${j} NO es leyenda válida: "${siguienteParrafo.texto.substring(0, 50)}..."`);
                            
                            if (resultado.tipoSugerido) {
                                leyendaEncontrada = {
                                    ...resultado,
                                    esError: true,
                                    indiceParrafo: j
                                };
                            }
                        }
                        break;
                    }
                }
            }
            
            if (leyendaEncontrada) {
                if (leyendaEncontrada.esError) {
                    errores.push({
                        tipo: "leyenda_imagen",
                        buscar: leyendaEncontrada.textoOriginal,
                        indiceParrafo: leyendaEncontrada.indiceParrafo,
                        mensaje: `La leyenda "${leyendaEncontrada.textoOriginal}" debe escribirse como "${leyendaEncontrada.tipoSugerido} X".`
                    });
                } else {
                    imagenesConLeyenda++;
                    correctos.push(
                        `✅ Elemento gráfico con leyenda correcta: "${leyendaEncontrada.textoCompleto}"`
                    );
                }
            } else {
                imagenesSinLeyenda++;
                
                errores.push({
                    tipo: "imagen_sin_leyenda",
                    buscar: `imagen_${i}`,
                    indiceParrafo: i,
                    indiceImagen: i,
                    mensaje: `La imagen no tiene leyenda debajo. Agregue "Figura X", "Gráfica X" o "Ilustración X".`
                });
            }
        }
        
        console.log("\n📊 RESUMEN DE IMÁGENES:");
        console.log(`   Total de imágenes: ${totalImagenes}`);
        console.log(`   Con leyenda válida: ${imagenesConLeyenda}`);
        console.log(`   Sin leyenda o con error: ${imagenesSinLeyenda}`);
        
        if (totalImagenes === 0) {
            correctos.push("✅ El documento no contiene elementos gráficos que requieran leyenda.");
        } else if (imagenesSinLeyenda === 0) {
            correctos.push(`✅ Todos los elementos gráficos (${totalImagenes}) cuentan con su leyenda correctamente.`);
        }
        
        return {
            correcto: true,
            totalImagenes,
            imagenesConLeyenda,
            imagenesSinLeyenda,
            correctos,
            errores
        };
        
    } catch (error) {
        console.error("❌ Error en analizarImagenes:", error.message);
        return {
            correcto: false,
            mensaje: error.message
        };
    }
}

module.exports = analizarImagenes;