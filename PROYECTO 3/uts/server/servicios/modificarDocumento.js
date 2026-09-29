// modificarDocumento.js

async function modificarDocumento(zip, comentarios) {
    try {
        let documentXml = await zip.file("word/document.xml").async("string");

        console.log(`📝 Insertando ${comentarios.length} comentarios...`);

        // 🔥 SEPARAR COMENTARIOS DE TÍTULOS Y ESPECIALES
                const comentariosEspeciales = comentarios.filter(c => 
            c.tipo === 'margenes' || 
            c.tipo === 'justificacion' || 
            c.tipo === 'interlineado' ||
            c.tipo === 'tamanio_texto' ||
            c.tipo === 'espaciado_parrafos' || 
            c.tipo === 'subtitulos_faltantes_nivel1' ||
            c.tipo === 'subtitulos_faltantes_nivel2' ||
            c.tipo === 'apartado_faltante' ||
            c.tipo === 'formato_combinado' ||
            c.tipo === 'imagen_sin_leyenda' ||
            c.tipo === 'leyenda_imagen' ||
            c.tipo === 'tabla_sin_titulo' ||
            c.tipo === 'tabla_sin_cita' ||
            c.tipo === 'tabla_titulo_error' ||
            (c.buscar && (c.buscar === 'margenes' || c.buscar === 'justificacion' || c.buscar === 'interlineado'))
        );
        
                const comentariosTitulos = comentarios.filter(c => 
            c.tipo !== 'margenes' && 
            c.tipo !== 'justificacion' && 
            c.tipo !== 'interlineado' &&
            c.tipo !== 'tamanio_texto' &&
            c.tipo !== 'espaciado_parrafos' &&  
            c.tipo !== 'subtitulos_faltantes_nivel1' &&
            c.tipo !== 'subtitulos_faltantes_nivel2' &&
            c.tipo !== 'apartado_faltante' &&
            c.tipo !== 'formato_combinado' &&
            c.tipo !== 'imagen_sin_leyenda' &&
            c.tipo !== 'leyenda_imagen' &&
            c.tipo !== 'tabla_sin_titulo' &&
            c.tipo !== 'tabla_sin_cita' &&
            c.tipo !== 'tabla_titulo_error' &&
            c.buscar !== 'margenes' && 
            c.buscar !== 'justificacion' && 
            c.buscar !== 'interlineado'
        );

        console.log(`📏 Especiales: ${comentariosEspeciales.length}, Títulos: ${comentariosTitulos.length}`);
        
        // 🔥🔥🔥 DEPURACIÓN DE COMENTARIOS ESPECIALES 🔥🔥🔥
        console.log("\n🔍🔍🔍 DEPURACIÓN - COMENTARIOS ESPECIALES 🔍🔍🔍");
        comentariosEspeciales.forEach((c, i) => {
            console.log(`   ${i+1}. tipo: ${c.tipo} | buscar: ${c.buscar} | indiceImagen: ${c.indiceImagen} | indiceParrafo: ${c.indiceParrafo}`);
        });
        console.log("🔍🔍🔍 FIN DEPURACIÓN 🔍🔍🔍\n");

                // 🔥 OBTENER TODOS LOS PÁRRAFOS DEL DOCUMENTO
        const parrafos = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g);
        if (!parrafos) {
            console.log("❌ No se encontraron párrafos");
            return;
        }

        // 🔥 OBTENER TODOS LOS BLOQUES (párrafos Y tablas) para tablas
        // 🔥 IMPORTANTE: Capturar PRIMERO las tablas, luego los párrafos
const bloques = documentXml.match(/<w:tbl\b[\s\S]*?<\/w:tbl>|<w:p[\s\S]*?<\/w:p>/g) || [];
console.log(`📦 Total de bloques: ${bloques.length}`);
const tablasEnBloques = bloques.filter(b => b.startsWith('<w:tbl')).length;
console.log(`📊 Tablas en bloques: ${tablasEnBloques}`);
        // ==========================================
        // 🔥 1. INSERTAR COMENTARIOS ESPECIALES
        // ==========================================
        if (comentariosEspeciales.length > 0) {
            comentariosEspeciales.forEach((comentario, index) => {
                const idComentario = comentarios.indexOf(comentario);
                let encontrado = false;

                // 🔥 PARA ERRORES DE TAMAÑO DE TEXTO
                if (comentario.tipo === 'tamanio_texto') {
                    const textoBuscado = comentario.buscar || '';
                    
                    if (textoBuscado) {
                        console.log(`🔍 Buscando texto para comentario de tamaño: "${textoBuscado.substring(0, 40)}..."`);
                        
                        // 🔥 BUSCAR EN CADA PÁRRAFO
                        for (let i = 0; i < parrafos.length; i++) {
                            const parrafo = parrafos[i];
                            const textoParrafo = extraerTextoParrafo(parrafo);
                            
                            // 🔥 COMPARACIÓN ESTRICTA - EL TEXTO DEBE COINCIDIR EXACTAMENTE
                            if (textoParrafo && textoParrafo === textoBuscado) {
                                console.log(`✅ Encontrado párrafo EXACTO en índice ${i}`);
                                console.log(`   Texto: "${textoParrafo.substring(0, 50)}..."`);
                                
                                // ⭐ RESALTAR el texto con fondo #F8DCDD
                                const parrafoResaltado = resaltarTextoF8DCDD(parrafo, textoBuscado);
                                documentXml = documentXml.replace(parrafo, parrafoResaltado);
                                
                                // Insertar comentario en el párrafo resaltado
                                documentXml = insertarComentarioEnParrafo(documentXml, parrafoResaltado, idComentario);
                                encontrado = true;
                                break;
                            }
                        }
                        
                        // 🔥 SI NO ENCUENTRA EXACTO, BUSCAR POR INCLUSIÓN
                        if (!encontrado) {
                            console.log(`⚠️ No encontrado exacto, buscando por inclusión...`);
                            for (let i = 0; i < parrafos.length; i++) {
                                const parrafo = parrafos[i];
                                const textoParrafo = extraerTextoParrafo(parrafo);
                                
                                // Buscar si el texto del párrafo contiene el texto buscado
                                if (textoParrafo && textoParrafo.toUpperCase().includes(textoBuscado.toUpperCase())) {
                                    console.log(`✅ Encontrado por INCLUSIÓN en índice ${i}`);
                                    console.log(`   Texto: "${textoParrafo.substring(0, 50)}..."`);
                                    
                                    // ⭐ RESALTAR el texto con fondo #F8DCDD
                                    const parrafoResaltado = resaltarTextoF8DCDD(parrafo, textoBuscado);
                                    documentXml = documentXml.replace(parrafo, parrafoResaltado);
                                    
                                    documentXml = insertarComentarioEnParrafo(documentXml, parrafoResaltado, idComentario);
                                    encontrado = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                // 🔥 SI ES UN ERROR DE SUBTÍTULO FALTANTE
if (!encontrado && (comentario.tipo === 'subtitulos_faltantes_nivel1' || comentario.tipo === 'subtitulos_faltantes_nivel2')) {
    const seccionPadre = comentario.buscar;
    console.log(`🔍 Buscando ubicación para subtítulo en: "${seccionPadre}"`);

    for (let i = 0; i < parrafos.length; i++) {
        const parrafo = parrafos[i];
        const texto = extraerTextoParrafo(parrafo);

        if (texto && texto.toUpperCase().includes(seccionPadre.toUpperCase())) {
            console.log(`✅ Insertando comentario #${idComentario} en párrafo ${i} (${seccionPadre})`);
            
            // ⭐ RESALTAR el texto con fondo #F8DCDD
            const parrafoResaltado = resaltarTextoF8DCDD(parrafo, seccionPadre);
            documentXml = documentXml.replace(parrafo, parrafoResaltado);
            
            documentXml = insertarComentarioEnParrafo(documentXml, parrafoResaltado, idComentario);
            encontrado = true;
            break;
        }
    }
}

                // 🔥 SI ES UN ERROR DE APARTADO FALTANTE
if (!encontrado && comentario.tipo === 'apartado_faltante') {
    const seccionPadre = comentario.buscar;
    console.log(`🔍 Buscando ubicación para apartado faltante en: "${seccionPadre}"`);

    for (let i = 0; i < parrafos.length; i++) {
        const parrafo = parrafos[i];
        const texto = extraerTextoParrafo(parrafo);

        if (texto && texto.toUpperCase().includes(seccionPadre.toUpperCase())) {
            console.log(`✅ Insertando comentario de apartado faltante en párrafo ${i}`);
            
            // ⭐ RESALTAR el texto con fondo #F8DCDD
            const parrafoResaltado = resaltarTextoF8DCDD(parrafo, seccionPadre);
            documentXml = documentXml.replace(parrafo, parrafoResaltado);
            
            documentXml = insertarComentarioEnParrafo(documentXml, parrafoResaltado, idComentario);
            encontrado = true;
            break;
        }
    }
}

                // 🔥 SI ES UN ERROR DE ESPACIADO ENTRE PÁRRAFOS
if (!encontrado && comentario.tipo === 'espaciado_parrafos') {
    // 🔥 USAR EL PÁRRAFO ESPECÍFICO DEL ERROR
    if (comentario.parrafoIncorrecto) {
        console.log(`✅ Insertando comentario de ESPACIADO en párrafo específico: "${comentario.textoParrafo || ''}"`);
        documentXml = insertarComentarioEnParrafo(documentXml, comentario.parrafoIncorrecto, idComentario);
        encontrado = true;
    } else {
        // Fallback: Buscar el primer párrafo normal
        console.log(`⚠️ No hay párrafo específico, buscando primer párrafo normal...`);
        if (parrafos) {
            for (let i = 0; i < parrafos.length; i++) {
                const parrafo = parrafos[i];
                const texto = extraerTextoParrafo(parrafo).trim();
                
                const esTitulo = 
                    parrafo.includes('w:b') || 
                    parrafo.includes('w:jc w:val="center"') ||
                    parrafo.includes('w:sz w:val="28"') ||
                    /^[IVXLCDM]+\./.test(texto) ||
                    /^\d+\.\d+/.test(texto);
                
                if (texto.length > 0 && !esTitulo) {
                    console.log(`✅ Insertando comentario de ESPACIADO en párrafo ${i} (fallback)`);
                    documentXml = insertarComentarioEnParrafo(documentXml, parrafo, idComentario);
                    encontrado = true;
                    break;
                }
            }
        }
    }
}

                                
                               // 🔥 SI ES UN ERROR DE IMAGEN SIN LEYENDA
                if (!encontrado && comentario.tipo === 'imagen_sin_leyenda') {
                    const indiceImagen = comentario.indiceImagen;
                    
                    if (indiceImagen !== undefined && parrafos[indiceImagen]) {
                        console.log(`✅ Insertando comentario de IMAGEN SIN LEYENDA DENTRO del párrafo ${indiceImagen}`);
                        
                        const parrafoImagen = parrafos[indiceImagen];
                        
                        // 🔥 Insertar el comentario DENTRO del párrafo de la imagen
                        // 1. Abrir el rango al inicio del párrafo
                        // 2. Cerrar el rango al final del párrafo
                        const comentarioInicio = `<w:commentRangeStart w:id="${idComentario}"/>`;
                        const comentarioFin = `<w:commentRangeEnd w:id="${idComentario}"/><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="${idComentario}"/></w:r>`;
                        
                        // Insertar el inicio después de <w:pPr>...</w:pPr> o al inicio del párrafo
                        let parrafoModificado = parrafoImagen;
                        
                        // Si tiene <w:pPr>, insertar después
                        if (parrafoModificado.includes('</w:pPr>')) {
                            parrafoModificado = parrafoModificado.replace(
                                '</w:pPr>',
                                `</w:pPr>${comentarioInicio}`
                            );
                        } else {
                            // Si no tiene <w:pPr>, insertar al inicio del párrafo
                            parrafoModificado = parrafoModificado.replace(
                                /(<w:p\b[^>]*>)/,
                                `$1${comentarioInicio}`
                            );
                        }
                        
                        // Insertar el fin antes del </w:p>
                        parrafoModificado = parrafoModificado.replace(
                            '</w:p>',
                            `${comentarioFin}</w:p>`
                        );
                        
                        documentXml = documentXml.replace(parrafoImagen, parrafoModificado);
                        encontrado = true;
                    }
                }

                                // 🔥 SI ES UN ERROR DE LEYENDA CON FORMATO INCORRECTO
                if (!encontrado && comentario.tipo === 'leyenda_imagen') {
                    const indiceParrafo = comentario.indiceParrafo;
                    const textoLeyenda = comentario.buscar;
                    
                    if (indiceParrafo !== undefined && parrafos[indiceParrafo]) {
                        console.log(`✅ Insertando comentario de LEYENDA CON ERROR en párrafo ${indiceParrafo}`);
                        const parrafoResaltado = resaltarTextoF8DCDD(parrafos[indiceParrafo], textoLeyenda);
                        documentXml = documentXml.replace(parrafos[indiceParrafo], parrafoResaltado);
                        
                        // 🔥 Insertar comentario de forma segura
                        documentXml = insertarComentarioEnParrafo(documentXml, parrafoResaltado, idComentario);
                        encontrado = true;
                    }
                }

                                 // 🔥 SI ES UN ERROR DE TABLA SIN TÍTULO
                if (!encontrado && comentario.tipo === 'tabla_sin_titulo') {
                    const indiceTabla = comentario.indiceTabla;
                    
                    if (indiceTabla !== undefined && bloques[indiceTabla]) {
                        console.log(`✅ Insertando comentario de TABLA SIN TÍTULO en bloque ${indiceTabla}`);
                        
                        const bloqueTabla = bloques[indiceTabla];
                        
                        // 🔥 Insertar el comentario DENTRO de la primera celda de la tabla
                        // Esto evita párrafos vacíos que empujan contenido
                        const comentarioInicio = `<w:commentRangeStart w:id="${idComentario}"/>`;
                        const comentarioFin = `<w:commentRangeEnd w:id="${idComentario}"/><w:r><w:commentReference w:id="${idComentario}"/></w:r>`;
                        
                        // Buscar el primer <w:p> dentro de la tabla
                        let bloqueModificado = bloqueTabla;
                        
                        // Insertar inicio del comentario justo después del primer <w:pPr>...</w:pPr> 
                        // o al inicio del primer párrafo de la tabla
                        const primerParrafoMatch = bloqueModificado.match(/<w:p\b[^>]*>/);
                        
                        if (primerParrafoMatch) {
                            // Insertar el inicio del comentario después de la apertura del primer párrafo
                            bloqueModificado = bloqueModificado.replace(
                                primerParrafoMatch[0],
                                `${primerParrafoMatch[0]}${comentarioInicio}`
                            );
                            
                            // Insertar el fin del comentario antes del cierre del último </w:p> ANTES del </w:tbl>
                            const ultimoPIndex = bloqueModificado.lastIndexOf('</w:p>');
                            if (ultimoPIndex !== -1) {
                                bloqueModificado = bloqueModificado.substring(0, ultimoPIndex) + 
                                                   comentarioFin + 
                                                   bloqueModificado.substring(ultimoPIndex);
                            }
                        }
                        
                        documentXml = documentXml.replace(bloqueTabla, bloqueModificado);
                        encontrado = true;
                    }
                }

                              // 🔥 SI ES UN ERROR DE TABLA SIN CITA
                if (!encontrado && comentario.tipo === 'tabla_sin_cita') {
                    const indiceTabla = comentario.indiceTabla;
                    
                    if (indiceTabla !== undefined && bloques[indiceTabla]) {
                        console.log(`✅ Insertando comentario de TABLA SIN CITA en bloque ${indiceTabla}`);
                        
                        const bloqueTabla = bloques[indiceTabla];
                        
                        // 🔥 Insertar el comentario DENTRO de la ÚLTIMA celda de la tabla
                                               const comentarioInicio = `<w:commentRangeStart w:id="${idComentario}"/>`;
                        const comentarioFin = `<w:commentRangeEnd w:id="${idComentario}"/><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="${idComentario}"/></w:r>`;
                        
                        let bloqueModificado = bloqueTabla;
                        
                        // Insertar el inicio del comentario justo después del inicio del ÚLTIMO párrafo
                        const ultimoParrafoIndex = bloqueModificado.lastIndexOf('<w:p ');
                        let ultimoParrafoOpen = ultimoParrafoIndex;
                        
                        if (ultimoParrafoIndex === -1) {
                            // Buscar <w:p> sin espacio (por si no tiene atributos)
                            ultimoParrafoOpen = bloqueModificado.lastIndexOf('<w:p>');
                        }
                        
                        if (ultimoParrafoOpen !== -1) {
                            // Encontrar el cierre del tag de apertura
                            const cierreTag = bloqueModificado.indexOf('>', ultimoParrafoOpen) + 1;
                            
                            // Insertar el inicio del comentario justo después
                            bloqueModificado = bloqueModificado.substring(0, cierreTag) + 
                                               comentarioInicio + 
                                               bloqueModificado.substring(cierreTag);
                            
                            // Insertar el fin del comentario antes del cierre del último </w:p>
                            const ultimoPCloseIndex = bloqueModificado.lastIndexOf('</w:p>');
                            if (ultimoPCloseIndex !== -1) {
                                bloqueModificado = bloqueModificado.substring(0, ultimoPCloseIndex) + 
                                                   comentarioFin + 
                                                   bloqueModificado.substring(ultimoPCloseIndex);
                            }
                        }
                        
                        documentXml = documentXml.replace(bloqueTabla, bloqueModificado);
                        encontrado = true;
                    }
                }

                // 🔥 SI ES UN ERROR DE TÍTULO DE TABLA MAL ESCRITO
                if (!encontrado && comentario.tipo === 'tabla_titulo_error') {
                    const indiceParrafo = comentario.indiceParrafo;
                    const textoLeyenda = comentario.buscar;
                    
                    if (indiceParrafo !== undefined && parrafos[indiceParrafo]) {
                        console.log(`✅ Insertando comentario de TÍTULO DE TABLA CON ERROR en párrafo ${indiceParrafo}`);
                        const parrafoResaltado = resaltarTextoF8DCDD(parrafos[indiceParrafo], textoLeyenda);
                        documentXml = documentXml.replace(parrafos[indiceParrafo], parrafoResaltado);
                        documentXml = insertarComentarioEnParrafo(documentXml, parrafoResaltado, idComentario);
                        encontrado = true;
                    }
                }

                // 🔥 SI ES UN ERROR DE MÁRGENES, JUSTIFICACIÓN O INTERLINEADO, INSERTAR AL INICIO
                if (!encontrado && (comentario.tipo === 'margenes' || comentario.tipo === 'justificacion' || comentario.tipo === 'interlineado' || comentario.tipo === 'espaciado_parrafos')) {
                    const bodyMatch = documentXml.match(/<w:body>/);
                    if (bodyMatch) {
                        const comentarioXML = `
    <w:p>
        <w:r>
            <w:commentRangeStart w:id="${idComentario}"/>
            <w:commentRangeEnd w:id="${idComentario}"/>
            <w:commentReference w:id="${idComentario}"/>
        </w:r>
    </w:p>`;
                        documentXml = documentXml.replace(/<w:body>/, `<w:body>${comentarioXML}`);
                        console.log(`✅ Comentario de ${comentario.tipo} insertado al inicio`);
                        encontrado = true;
                    }
                }

               // 🔥 SI ES UN ERROR DE FORMATO COMBINADO (TÍTULOS Y SUBTÍTULOS)
if (!encontrado && comentario.tipo === 'formato_combinado') {
    const tituloBuscar = comentario.buscar;
    console.log(`🔍 Buscando título para formato combinado: "${tituloBuscar}"`);

    for (let i = 0; i < parrafos.length; i++) {
        const parrafo = parrafos[i];
        const texto = extraerTextoParrafo(parrafo);

        if (texto && texto.toUpperCase().includes(tituloBuscar.toUpperCase())) {
            console.log(`✅ Insertando comentario de formato combinado en párrafo ${i}`);
            
            // ⭐ RESALTAR el texto con fondo #F8DCDD
            const parrafoResaltado = resaltarTextoF8DCDD(parrafo, tituloBuscar);
            documentXml = documentXml.replace(parrafo, parrafoResaltado);
            
            // Insertar comentario en el párrafo resaltado
            documentXml = insertarComentarioEnParrafo(documentXml, parrafoResaltado, idComentario);
            encontrado = true;
            break;
        }
    }
}

                // Si no se encontró ubicación, insertar al inicio como fallback
                if (!encontrado) {
                    console.log(`⚠️ No se encontró ubicación para comentario #${idComentario} (${comentario.tipo}), insertando al inicio`);
                    const bodyMatch = documentXml.match(/<w:body>/);
                    if (bodyMatch) {
                        const comentarioXML = `
    <w:p>
        <w:r>
            <w:commentRangeStart w:id="${idComentario}"/>
            <w:commentRangeEnd w:id="${idComentario}"/>
            <w:commentReference w:id="${idComentario}"/>
        </w:r>
    </w:p>`;
                        documentXml = documentXml.replace(/<w:body>/, `<w:body>${comentarioXML}`);
                    }
                }
            });
        }

        // ==========================================
        // 🔥 2. INSERTAR COMENTARIOS DE TÍTULOS
        // ==========================================
        if (comentariosTitulos.length > 0) {
            comentariosTitulos.forEach((comentario, index) => {
                if (!comentario.buscar) return;

                const tituloBuscar = comentario.buscar.trim().toUpperCase();
                console.log(`🔍 Buscando título: "${tituloBuscar}"`);

                let encontrado = false;

                for (let i = 0; i < parrafos.length; i++) {
                    const parrafo = parrafos[i];
                    const texto = extraerTextoParrafo(parrafo).toUpperCase();

                    if (texto.length === 0) continue;

                    if (texto === tituloBuscar || texto.includes(tituloBuscar)) {
                        console.log(`✅ Encontrado en párrafo ${i}: "${texto}"`);

                        const idComentario = comentarios.indexOf(comentario);
                        documentXml = insertarComentarioEnParrafo(documentXml, parrafo, idComentario);
                        encontrado = true;
                        console.log(`✅ Comentario #${idComentario} insertado en título`);
                        break;
                    }
                }

                if (!encontrado) {
                    console.log(`⚠️ NO encontrado: "${tituloBuscar}"`);
                }
            });
        }

        // 🔥 ACTUALIZAR EL DOCUMENTO
        zip.file("word/document.xml", documentXml);
        console.log("✅ document.xml modificado");

    } catch (error) {
        console.error("❌ Error en modificarDocumento:", error.message);
        throw error;
    }
}

function extraerTextoParrafo(parrafo) {
    const textos = [...parrafo.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)]
        .map(t => t[1])
        .join("");
    return textos;  // ← SIN .trim() para preservar espacios
}

function insertarComentarioEnParrafo(documentXml, parrafo, idComentario) {
    const comentarioXML = `<w:commentRangeStart w:id="${idComentario}"/><w:commentRangeEnd w:id="${idComentario}"/><w:r><w:commentReference w:id="${idComentario}"/></w:r>`;
    
    // 🔥 Buscar el ÚLTIMO <w:r> con texto (preservando espacios)
    const runsConTexto = parrafo.match(/<w:r[^>]*>[\s\S]*?<w:t[^>]*>[\s\S]*?<\/w:t>[\s\S]*?<\/w:r>/g);
    
    if (runsConTexto && runsConTexto.length > 0) {
        const ultimoRun = runsConTexto[runsConTexto.length - 1];
        // 🔥 Insertar comentario DESPUÉS del run, sin modificar el run original
        const nuevoParrafo = parrafo.replace(ultimoRun, `${ultimoRun}${comentarioXML}`);
        // 🔥 Reemplazar SOLO este párrafo en el documento completo
        return documentXml.replace(parrafo, nuevoParrafo);
    }
    
    // Fallback: insertar al final del párrafo
    return documentXml.replace(parrafo, `${parrafo}${comentarioXML}`);
}

// ⭐ FUNCIÓN MEJORADA - RESALTA TODOS LOS RUNS QUE COINCIDAN CON EL TEXTO BUSCADO
function resaltarTextoF8DCDD(parrafo, textoBuscado) {
    if (!textoBuscado) return parrafo;
    
    console.log(`🔍 RESALTANDO: "${textoBuscado}"`);
    
    const textoBuscadoUpper = textoBuscado.toUpperCase().trim();
    const textoBuscadoLower = textoBuscado.toLowerCase().trim();
    
    // 🔥 OBTENER TODOS LOS RUNS DEL PÁRRAFO
    const runs = parrafo.match(/<w:r[^>]*>[\s\S]*?<\/w:r>/g);
    if (!runs) return parrafo;
    
    let nuevoParrafo = parrafo;
    let resaltados = 0;
    
    // 🔥 EXTRAER TEXTO COMPLETO PARA VERIFICAR
    let textoCompleto = '';
    for (let run of runs) {
        const matchTexto = run.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/);
        if (matchTexto) {
            textoCompleto += matchTexto[1];
        }
    }
    
    console.log(`📄 TEXTO COMPLETO: "${textoCompleto}"`);
    const textoCompletoUpper = textoCompleto.toUpperCase();
    
    const contieneTexto = textoCompletoUpper.includes(textoBuscadoUpper) || 
                         textoCompletoUpper.includes(textoBuscadoLower.toUpperCase());
    
    console.log(`🔍 ¿Contiene texto? ${contieneTexto}`);
    
    if (!contieneTexto) return parrafo;
    
    // 🔥 PROCESAR TODOS LOS RUNS - BUSCAR EL TEXTO COMPLETO EN TODOS
    for (let i = 0; i < runs.length; i++) {
        const run = runs[i];
        const matchTexto = run.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/);
        if (!matchTexto) continue;
        
        const texto = matchTexto[1];
        const textoUpper = texto.toUpperCase();
        
        // Si el run contiene el texto buscado O si el párrafo contiene el texto y este run tiene algo
        const coincide = textoUpper.includes(textoBuscadoUpper) || 
                        textoUpper.includes(textoBuscadoLower.toUpperCase());
        
        // 🔥 TAMBIÉN: si el texto del run tiene caracteres que forman parte del texto buscado
        const textoBuscadoPalabras = textoBuscadoUpper.split(' ');
        let coincideParcial = false;
        for (let palabra of textoBuscadoPalabras) {
            if (palabra.length > 2 && textoUpper.includes(palabra)) {
                coincideParcial = true;
                break;
            }
        }
        
        if (coincide || coincideParcial) {
            console.log(`   ✅ Run ${i+1} COINCIDE: "${texto}"`);
            
            if (run.includes('w:fill="F8DCDD"') || run.includes('<w:highlight')) {
                continue;
            }
            
            const attrsMatch = run.match(/<w:t([^>]*)>/);
            const attrs = attrsMatch ? attrsMatch[1] : '';
            
            const nuevoRun = run.replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/, (match, textoOriginal) => {
                return `<w:r>
                            <w:rPr>
                                <w:shd w:val="clear" w:color="auto" w:fill="F8DCDD"/>
                            </w:rPr>
                            <w:t${attrs}>${textoOriginal}</w:t>
                        </w:r>`;
            });
            
            nuevoParrafo = nuevoParrafo.replace(run, nuevoRun);
            resaltados++;
        }
    }
    
    console.log(`✅ RESALTADOS: ${resaltados} runs`);
    
    return nuevoParrafo;
}
// 🔥 FUNCIÓN AUXILIAR - OBTIENE EL TEXTO COMPLETO DEL PÁRRAFO
function obtenerTextoCompletoParrafo(parrafo) {
    const textos = [...parrafo.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
        .map(t => t[1])
        .join("");
    return textos;
}

module.exports = modificarDocumento;