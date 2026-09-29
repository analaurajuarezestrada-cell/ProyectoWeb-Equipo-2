const mammoth = require("mammoth");
const levenshtein = require("fast-levenshtein");
const analizarFormato = require("./analizarFormato");
const analizarMargenes = require("./analizarMargenes");
const analizarJustificacion = require("./analizarJustificacion");
const analizarInterlineado = require("./analizarInterlineado");
const analizarTamanoTexto = require("./analizarTamanoTexto");
const analizarEspaciadoParrafos = require("./analizarEspaciadoParrafos");
const analizarImagenes = require("./analizarImagenes");
const analizarTablas = require("./analizarTablas");


async function analizarTesina(rutaArchivo) {

    try {

        // Leer el documento
        const resultado = await mammoth.extractRawText({
            path: rutaArchivo
        });

        const texto = resultado.value;

        let correctos = [];
        let errores = [];

        let ultimaSeccionEncontrada = "";

        console.log("VOY A EJECUTAR ANALIZAR FORMATO");

        // ==========================================
        // ANALIZAR FORMATO DE TÍTULOS
        // ==========================================
        const resultadoFormato = await analizarFormato(rutaArchivo);

        // ==========================================
        // ANALIZAR MÁRGENES DEL DOCUMENTO
        // ==========================================
        console.log("📏 ANALIZANDO MÁRGENES...");
        const resultadoMargenes = await analizarMargenes(rutaArchivo);
        console.log("📏 RESULTADO MÁRGENES:", JSON.stringify(resultadoMargenes, null, 2));
        
        if (resultadoMargenes.correcto) {
            if (resultadoMargenes.correctos && resultadoMargenes.correctos.length > 0) {
                correctos.push(...resultadoMargenes.correctos);
            }
        } else {
            const erroresMargenes = resultadoMargenes.errores || [];
            if (erroresMargenes.length > 0) {
                erroresMargenes.forEach(error => {
                    if (typeof error === 'string') {
                        errores.push({
                            tipo: "margenes",
                            buscar: "margenes",
                            mensaje: error
                        });
                        console.log(`📏 Error de márgenes agregado: ${error.substring(0, 50)}...`);
                    } else {
                        errores.push(error);
                        console.log(`📏 Error de márgenes agregado (objeto)`);
                    }
                });
            }
        }

        // ==========================================
        // ANALIZAR JUSTIFICACIÓN DEL DOCUMENTO
        // ==========================================
        console.log("📐 ANALIZANDO JUSTIFICACIÓN...");
        const resultadoJustificacion = await analizarJustificacion(rutaArchivo);
        console.log("📐 RESULTADO JUSTIFICACIÓN:", JSON.stringify(resultadoJustificacion, null, 2));
        
        if (resultadoJustificacion.correcto) {
            if (resultadoJustificacion.correctos && resultadoJustificacion.correctos.length > 0) {
                correctos.push(...resultadoJustificacion.correctos);
            }
        } else {
            const erroresJustificacion = resultadoJustificacion.errores || [];
            if (erroresJustificacion.length > 0) {
                erroresJustificacion.forEach(error => {
                    if (typeof error === 'string') {
                        errores.push({
                            tipo: "justificacion",
                            buscar: "justificacion",
                            mensaje: error
                        });
                        console.log(`📐 Error de justificación agregado: ${error.substring(0, 50)}...`);
                    } else {
                        errores.push(error);
                        console.log(`📐 Error de justificación agregado (objeto)`);
                    }
                });
            }
        }

        // ==========================================
        // ANALIZAR INTERLINEADO DEL DOCUMENTO
        // ==========================================
        console.log("📏 ANALIZANDO INTERLINEADO...");
        const resultadoInterlineado = await analizarInterlineado(rutaArchivo);
        console.log("📏 RESULTADO INTERLINEADO:", JSON.stringify(resultadoInterlineado, null, 2));
        
        if (resultadoInterlineado.correcto) {
            if (resultadoInterlineado.correctos && resultadoInterlineado.correctos.length > 0) {
                correctos.push(...resultadoInterlineado.correctos);
            }
        } else {
            const erroresInterlineado = resultadoInterlineado.errores || [];
            if (erroresInterlineado.length > 0) {
                erroresInterlineado.forEach(error => {
                    if (typeof error === 'string') {
                        errores.push({
                            tipo: "interlineado",
                            buscar: "interlineado",
                            mensaje: error
                        });
                        console.log(`📏 Error de interlineado agregado: ${error.substring(0, 50)}...`);
                    } else {
                        errores.push(error);
                        console.log(`📏 Error de interlineado agregado (objeto)`);
                    }
                });
            }
        }

                // ==========================================
        // ANALIZAR TAMAÑO DE TEXTO NORMAL (12pt)
        // ==========================================
        console.log("📏 ANALIZANDO TAMAÑO DE TEXTO NORMAL...");
        const resultadoTamanoTexto = await analizarTamanoTexto(rutaArchivo);
        console.log("📏 RESULTADO TAMAÑO TEXTO:", JSON.stringify(resultadoTamanoTexto, null, 2));
        
        if (resultadoTamanoTexto.correcto) {
            if (resultadoTamanoTexto.correctos && resultadoTamanoTexto.correctos.length > 0) {
                correctos.push(...resultadoTamanoTexto.correctos);
            }
        } else {
            const erroresTamano = resultadoTamanoTexto.errores || [];
            if (erroresTamano.length > 0) {
                erroresTamano.forEach(error => {
                    if (typeof error === 'string') {
                        errores.push({
                            tipo: "tamanio_texto",
                            buscar: "tamanio_texto",
                            mensaje: error
                        });
                        console.log(`📏 Error de tamaño de texto agregado: ${error.substring(0, 50)}...`);
                    } else {
                        errores.push(error);
                        console.log(`📏 Error de tamaño de texto agregado (objeto)`);
                    }
                });
            }
        }

                // ==========================================
        // ANALIZAR ESPACIADO ENTRE PÁRRAFOS
        // ==========================================
        console.log("📏 ANALIZANDO ESPACIADO ENTRE PÁRRAFOS...");
        const resultadoEspaciado = await analizarEspaciadoParrafos(rutaArchivo);
        console.log("📏 RESULTADO ESPACIADO:", JSON.stringify(resultadoEspaciado, null, 2));
        
        if (resultadoEspaciado.correcto) {
            if (resultadoEspaciado.correctos && resultadoEspaciado.correctos.length > 0) {
                correctos.push(...resultadoEspaciado.correctos);
            }
        } else {
            const erroresEspaciado = resultadoEspaciado.errores || [];
            if (erroresEspaciado.length > 0) {
                erroresEspaciado.forEach(error => {
                    // 🔥 PROCESAR CADA ERROR CON SU PÁRRAFO
                    if (typeof error === 'object' && error.mensaje) {
                        const errorObj = {
                            tipo: "espaciado_parrafos",
                            buscar: "espaciado_parrafos",
                            mensaje: error.mensaje || "Este párrafo no tiene espaciado de 6 pt."
                        };
                        
                        // 🔥 SI TIENE PÁRRAFO INCORRECTO, AGREGARLO
                        if (error.parrafoIncorrecto) {
                            errorObj.parrafoIncorrecto = error.parrafoIncorrecto;
                            errorObj.textoParrafo = error.textoParrafo || "";
                        }
                        
                        errores.push(errorObj);
                        console.log(`📏 Error de espaciado agregado: ${error.mensaje} (${error.parrafoIncorrecto ? 'con párrafo' : 'sin párrafo'})`);
                    } else if (typeof error === 'string') {
                        errores.push({
                            tipo: "espaciado_parrafos",
                            buscar: "espaciado_parrafos",
                            mensaje: error
                        });
                        console.log(`📏 Error de espaciado agregado: ${error}`);
                    } else {
                        errores.push({
                            tipo: "espaciado_parrafos",
                            buscar: "espaciado_parrafos",
                            mensaje: "Error de espaciado entre párrafos."
                        });
                        console.log(`📏 Error de espaciado agregado (objeto desconocido)`);
                    }
                });
            }
        }

                // ==========================================
        // ANALIZAR IMÁGENES Y LEYENDAS
        // ==========================================
        console.log("🖼️ ANALIZANDO IMÁGENES Y LEYENDAS...");
        const resultadoImagenes = await analizarImagenes(rutaArchivo);
        console.log("🖼️ RESULTADO IMÁGENES:", JSON.stringify(resultadoImagenes, null, 2));

               // 🔥 CORRECCIÓN: correcto=true NO significa que todo esté bien
        // Simplemente significa que la función no crasheó.
        // Los CORRECTOS y los ERRORES se agregan SIEMPRE.
        if (resultadoImagenes.correctos && resultadoImagenes.correctos.length > 0) {
            correctos.push(...resultadoImagenes.correctos);
        }
        
        const erroresImagenes = resultadoImagenes.errores || [];
        if (erroresImagenes.length > 0) {
            erroresImagenes.forEach(error => {
                if (typeof error === 'string') {
                    errores.push({
                        tipo: "imagen_leyenda",
                        buscar: "imagen_leyenda",
                        mensaje: error
                    });
                } else {
                    errores.push(error);
                }
            });
        }

               // ==========================================
        // ANALIZAR TABLAS
        // ==========================================
        console.log("📊 ANALIZANDO TABLAS...");
        const resultadoTablas = await analizarTablas(rutaArchivo);
        console.log("📊 RESULTADO TABLAS:", JSON.stringify(resultadoTablas, null, 2));

        if (resultadoTablas.correctos && resultadoTablas.correctos.length > 0) {
            correctos.push(...resultadoTablas.correctos);
        }
        
                const erroresTablas = resultadoTablas.errores || [];
        
        // 🔥 VERIFICAR CUÁNTOS ERRORES DE TABLA LLEGAN
        console.log(`\n🔍🔍🔍 ERRORES DE TABLA RECIBIDOS: ${erroresTablas.length} 🔍🔍🔍`);
        erroresTablas.forEach((e, i) => {
            console.log(`   ${i+1}. tipo: ${e.tipo} | indiceTabla: ${e.indiceTabla} | indiceParrafo: ${e.indiceParrafo}`);
        });
        console.log(`🔍🔍🔍 FIN 🔍🔍🔍\n`);

        if (erroresTablas.length > 0) {
            erroresTablas.forEach(error => {
                if (typeof error === 'string') {
                    errores.push({
                        tipo: "tabla_error",
                        buscar: "tabla_error",
                        mensaje: error
                    });
                } else {
                    errores.push(error);
                }
            });
        }

        console.log("===== FORMATO DEVUELTO =====");
        console.log(resultadoFormato);

        // ==========================================
        // 1. GUARDAR ACIERTOS DE FORMATO
        // ==========================================
        const aciertosFormato = resultadoFormato.correctos || [];
        correctos.push(...aciertosFormato);

        // ==========================================
        // 2. PROCESAR ERRORES DE FORMATO
        // ==========================================
        const erroresFormato = resultadoFormato.errores || [];

        // ==========================================
        // 3. SECCIONES OBLIGATORIAS (PRINCIPALES)
        // ==========================================
        const seccionesObligatorias = {
            "I. INTRODUCCIÓN": ["INTRODUCCION"],
            "II. DESARROLLO": [],
            "III. CONCLUSIONES Y RECOMENDACIONES": [],
            "BIBLIOGRAFÍA": ["BIBLIOGRAFIA"],
            "ANEXOS": []
        };

        // ==========================================
        // 3.1 SUBTÍTULOS OBLIGATORIOS POR NIVEL
        // ==========================================
        const subseccionesObligatorias = {
            "nivel1": {
                "I. INTRODUCCIÓN": [
                    "I.1 Conceptualización de la Estadía",
                    "I.2 Contextualización"
                ],
                "II. DESARROLLO": [
                    "II.1 Marco referencial",
                    "II.2 Estado del Arte",
                    "II.3 Materiales y métodos",
                    "II.4 Procesamiento de resultados, análisis y discusión"
                ]
            },
            "nivel2": {
                "I. INTRODUCCIÓN": [
                    "I.2.1 Localización geográfica de la empresa",
                    "I.2.2 Giro y tamaño de la empresa",
                    "I.2.3 Área de influencia",
                    "I.2.4 Objetivos de la empresa"
                ],
                "II. DESARROLLO": [
                    "II.1.1 Microeconomía de la empresa",
                    "II.1.2 Motivo de estudio",
                    "II.1.3 Desarrollo del Objetivo"
                ]
            }
        };

        // Almacenar SOLO errores de título (mayúsculas, ortografía)
        const erroresTituloPorSeccion = {};

 
       // ==========================================
// 3.2 VALIDAR SECCIONES PRINCIPALES
// ==========================================
Object.keys(seccionesObligatorias).forEach(seccion => {

    const tituloEncontrado = texto.split(/\r?\n/).find(linea => 
        linea.trim().toUpperCase() === seccion.toUpperCase()
    );

    if (tituloEncontrado) {
        if (tituloEncontrado.trim() === seccion) {
            // Solo agregar correcto si no se agregó antes
            const yaExiste = correctos.some(c => c.includes(`"${seccion}"`));
            if (!yaExiste) {
                correctos.push(`✅ El apartado "${seccion}" fue encontrado correctamente`);
            }
            ultimaSeccionEncontrada = seccion;
        } else {
            // Ya se maneja en la validación de títulos mal escritos
            ultimaSeccionEncontrada = seccion;
        }
    }
});

                // ==========================================
        // 3.3 VALIDAR SUBTÍTULOS POR NIVEL (TODOS DE UNA VEZ)
        // ==========================================
        console.log("📑 VALIDANDO SUBTÍTULOS...");
        
        // 🔥 FUNCIÓN AUXILIAR
        function validarSubtitulos(seccionPadre, subsecciones, texto, nivel) {
            const seccionPadreEncontrada = texto.split(/\r?\n/).find(linea => 
                linea.trim().toUpperCase() === seccionPadre.toUpperCase()
            );
            
            if (!seccionPadreEncontrada) return { encontrados: [], faltantes: [] };
            
            const lineas = texto.split(/\r?\n/);
            let indicePadre = -1;
            for (let i = 0; i < lineas.length; i++) {
                if (lineas[i].trim().toUpperCase() === seccionPadre.toUpperCase()) {
                    indicePadre = i;
                    break;
                }
            }
            
            if (indicePadre === -1) return { encontrados: [], faltantes: [] };
            
            const textoDesdePadre = lineas.slice(indicePadre + 1).join("\n");
            let encontrados = [];
            let faltantes = [];
            
            subsecciones.forEach(subseccion => {
                const subseccionEncontrada = textoDesdePadre.split(/\r?\n/).find(linea => 
                    linea.trim().toUpperCase() === subseccion.toUpperCase()
                );
                
                if (subseccionEncontrada) {
                    encontrados.push(subseccion);
                    correctos.push(`✅ El subtítulo "${subseccion}" fue encontrado correctamente`);
                } else {
                    faltantes.push(subseccion);
                }
            });
            
            return { encontrados, faltantes };
        }

               // 🔥 VALIDAR NIVEL 1
        console.log("📑 Validando subtítulos de NIVEL 1...");
        Object.keys(subseccionesObligatorias.nivel1).forEach(seccionPadre => {
            const subsecciones = subseccionesObligatorias.nivel1[seccionPadre];
            const resultado = validarSubtitulos(seccionPadre, subsecciones, texto, 1);
            
            if (resultado.faltantes.length > 0) {
                let mensaje = `❌ Faltan los siguientes subtítulos (Nivel 1) en "${seccionPadre}":\n`;
                resultado.faltantes.forEach((sub, index) => {
                    mensaje += `   ${index + 1}. ${sub}\n`;
                });
                
                errores.push({
                    tipo: "subtitulos_faltantes_nivel1",
                    // 🔥 USAR EL TÍTULO PRINCIPAL COMO UBICACIÓN
                    buscar: seccionPadre,
                    mensaje: mensaje
                });
            }
        });
                // 🔥 VALIDAR NIVEL 2 (SIEMPRE)
        console.log("📑 Validando subtítulos de NIVEL 2...");
        Object.keys(subseccionesObligatorias.nivel2).forEach(seccionPadre => {
            const subsecciones = subseccionesObligatorias.nivel2[seccionPadre];
            
            const resultado = validarSubtitulos(seccionPadre, subsecciones, texto, 2);
            
            if (resultado.faltantes.length > 0) {
                // 🔥 ENCONTRAR EL SUBTÍTULO PADRE CORRESPONDIENTE
                let subtituloPadre = "";
                if (seccionPadre === "I. INTRODUCCIÓN") {
                    subtituloPadre = "I.2 Contextualización";
                } else if (seccionPadre === "II. DESARROLLO") {
                    subtituloPadre = "II.1 Marco referencial";
                }
                
                let mensaje = `❌ Faltan los siguientes subtítulos (Nivel 2) en "${seccionPadre}":\n`;
                resultado.faltantes.forEach((sub, index) => {
                    mensaje += `   ${index + 1}. ${sub}\n`;
                });
                
                errores.push({
                    tipo: "subtitulos_faltantes_nivel2",
                    // 🔥 USAR EL SUBTÍTULO PADRE COMO UBICACIÓN
                    buscar: subtituloPadre || seccionPadre,
                    mensaje: mensaje
                });
            }
        });
        // ==========================================
        // 4. COMBINAR TODOS LOS ERRORES DE FORMATO Y TÍTULO
        // ==========================================

        // ==========================================
// 4. COMBINAR TODOS LOS ERRORES DE FORMATO Y TÍTULO
// ==========================================

const todosLosErroresPorTitulo = {};

// 🔥 PROCESAR ERRORES DE FORMATO - USAR MENSAJES COMPLETOS
erroresFormato.forEach(error => {
    const titulo = error.buscar;
    const tituloKey = titulo.toUpperCase();
    
    if (!todosLosErroresPorTitulo[tituloKey]) {
        todosLosErroresPorTitulo[tituloKey] = {
            tituloOriginal: titulo,
            errores: []
        };
    }
    
    // 🔥 NO MODIFICAR EL MENSAJE, USARLO TAL CUAL
    const mensaje = error.mensaje;
    
    if (!todosLosErroresPorTitulo[tituloKey].errores.includes(mensaje)) {
        todosLosErroresPorTitulo[tituloKey].errores.push(mensaje);
    }
});

        Object.keys(erroresTituloPorSeccion).forEach(tituloKey => {
            const tituloOriginal = erroresTituloPorSeccion[tituloKey].tituloOriginal;
            
            if (!todosLosErroresPorTitulo[tituloKey]) {
                todosLosErroresPorTitulo[tituloKey] = {
                    tituloOriginal: tituloOriginal,
                    errores: []
                };
            }
            
            const erroresTitulo = erroresTituloPorSeccion[tituloKey].errores;
            erroresTitulo.forEach(errorTitulo => {
                const yaExiste = todosLosErroresPorTitulo[tituloKey].errores.some(
                    e => e.includes("debe escribirse correctamente")
                );
                if (!yaExiste) {
                    todosLosErroresPorTitulo[tituloKey].errores.push(errorTitulo);
                }
            });
        });

        const erroresCombinados = [];

        Object.keys(todosLosErroresPorTitulo).forEach(tituloKey => {
    const { tituloOriginal, errores: listaErrores } = todosLosErroresPorTitulo[tituloKey];
    
    const erroresUnicos = [...new Set(listaErrores)];
    
    if (erroresUnicos.length > 0) {
        // 🔥 DETECTAR SI ES UN ERROR DE FORMATO (ya tiene formato completo)
        const esErrorFormato = erroresUnicos.some(e => 
            e.includes("El título") || 
            e.includes("El subtítulo") || 
            e.includes("El subsubtítulo")
        );
        
        if (esErrorFormato) {
            // 🔥 PARA ERRORES DE FORMATO, USAR EL MENSAJE COMPLETO TAL CUAL
            erroresUnicos.forEach(mensaje => {
                erroresCombinados.push({
                    tipo: "formato_combinado",
                    buscar: tituloOriginal,
                    mensaje: mensaje
                });
            });
        } else {
            // 🔥 PARA OTROS ERRORES (como "debe escribirse correctamente")
            const mensajeCombinado = erroresUnicos.join(", ");
            const mensajeFinal = mensajeCombinado.charAt(0).toUpperCase() + mensajeCombinado.slice(1);
            
            const esSubtitulo = /^[IVXLCDM]+\.\d+/.test(tituloOriginal);
            const tipoTexto = esSubtitulo ? "subtítulo" : "título";
            
            erroresCombinados.push({
                tipo: "formato_combinado",
                buscar: tituloOriginal,
                mensaje: `El ${tipoTexto} "${tituloOriginal}" ${mensajeFinal}.`
            });
        }
    }
});

        // ==========================================
        // 5. VALIDACIÓN: Documento no vacío
        // ==========================================
        if (texto.length > 0) {
            correctos.push("✅ El documento pudo abrirse correctamente.");
        } else {
            erroresCombinados.push({
                tipo: "general",
                buscar: "",
                mensaje: "❌ El documento está vacío."
            });
        }

               // ==========================================
        // 6. COMBINAR TODOS LOS ERRORES
        // ==========================================
        
        // 🔥 PRIMERO: Agregar los errores de tamaño a erroresCombinados
        const erroresTamano = errores.filter(e => e.tipo === 'tamanio_texto');
        erroresTamano.forEach(error => {
            const yaExiste = erroresCombinados.some(e => 
                e.tipo === error.tipo && 
                e.mensaje === error.mensaje
            );
            if (!yaExiste) {
                erroresCombinados.push(error);
            }
        });
        
        erroresCombinados.forEach(error => {
            const yaExiste = errores.some(e => 
                e.tipo === error.tipo && 
                e.buscar === error.buscar
            );
            if (!yaExiste) {
                errores.push(error);
            }
        });
        // ==========================================
        // 7. ELIMINAR DUPLICADOS (CORREGIDO - VERSION FINAL)
        // ==========================================
        const erroresUnicosFinal = [];
        const erroresVistosFinal = new Set();

        errores.forEach(error => {
            let clave = '';
            
            // 🔥 DIFERENTES TIPOS DE ERRORES CON CLAVES ÚNICAS
            if (error.tipo === 'margenes') {
                clave = `margenes_${error.mensaje}`;
            } else if (error.tipo === 'subtitulos_faltantes_nivel1' || error.tipo === 'subtitulos_faltantes_nivel2') {
                clave = `subtitulos_${error.buscar}_${error.mensaje}`;
            } else if (error.tipo === 'espaciado_parrafos') {
                // 🔥 CLAVE ÚNICA PARA CADA ERROR DE ESPACIADO
                clave = `espaciado_parrafos_${error.mensaje}`;
            } else if (error.tipo === 'formato_combinado') {
                // 🔥 CLAVE ÚNICA PARA CADA ERROR DE FORMATO
                clave = `formato_combinado_${error.buscar}_${error.mensaje}`;
            } else if (error.tipo === 'tamanio_texto') {
                clave = `tamanio_texto_${error.mensaje}`;
            } else if (error.tipo === 'justificacion') {
                clave = `justificacion_${error.mensaje}`;
                        } else if (error.tipo === 'interlineado') {
                clave = `interlineado_${error.mensaje}`;
            } else if (error.tipo === 'imagen_sin_leyenda') {
                clave = `imagen_sin_leyenda_${error.indiceImagen}`;
            } else if (error.tipo === 'leyenda_imagen') {
                clave = `leyenda_imagen_${error.indiceParrafo}_${error.buscar}`;
            } else if (error.tipo === 'tabla_sin_titulo' || error.tipo === 'tabla_sin_cita') {
                clave = `${error.tipo}_${error.indiceTabla}`;
            } else if (error.tipo === 'tabla_titulo_error') {
                clave = `tabla_titulo_error_${error.indiceParrafo}_${error.buscar}`;
            } else {
                clave = `${error.tipo}_${error.buscar || ''}`;
            }
            
            if (!erroresVistosFinal.has(clave)) {
                erroresVistosFinal.add(clave);
                erroresUnicosFinal.push(error);
            }
        });

        errores = erroresUnicosFinal;

                console.log("📊 RESULTADO FINAL:");
        console.log("✅ Correctos:", correctos.length);
        console.log("❌ Errores:", errores.length);
        if (errores.length > 0) {
            console.log("📝 Detalle de errores:");
            errores.forEach((e, i) => {
                console.log(`   ${i+1}. [${e.tipo}] ${e.mensaje}`);
            });
        }
        
        // 🔥🔥🔥 LOGS DE DEPURACIÓN PARA IMÁGENES 🔥🔥🔥
        console.log("\n🔍🔍🔍 DEPURACIÓN FINAL - ERRORES DE IMÁGENES 🔍🔍🔍");
        const erroresImagenFinal = errores.filter(e => 
            e.tipo === 'imagen_sin_leyenda' || e.tipo === 'leyenda_imagen'
        );
        console.log(`📊 Cantidad de errores de imagen en el array final: ${erroresImagenFinal.length}`);
        erroresImagenFinal.forEach((e, i) => {
            console.log(`   ${i+1}. tipo: ${e.tipo}`);
            console.log(`      indiceImagen: ${e.indiceImagen}`);
            console.log(`      indiceParrafo: ${e.indiceParrafo}`);
            console.log(`      buscar: ${e.buscar}`);
            console.log(`      mensaje: ${e.mensaje}`);
        });
        console.log("🔍🔍🔍 FIN DEPURACIÓN 🔍🔍🔍\n");

        return {
            correcto: true,
            texto,
            correctos,
            errores
        };

    } catch (error) {
        console.error(error);
        return {
            correcto: false,
            mensaje: error.message
        };
    }
}

module.exports = analizarTesina;