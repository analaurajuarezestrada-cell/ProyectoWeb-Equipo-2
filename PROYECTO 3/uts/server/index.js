const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
//const generarComentariosWord = require("./servicios/generarComentariosWord");
const insertarComentariosWord = require("./servicios/insertarComentariosWord");
const analizarTesina = require("./analizador/analizarTesina");
const analizarFormato = require("./analizador/analizarFormato");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {

      if (filePath.endsWith(".docx")) {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );

        res.setHeader("Content-Disposition", "inline");
      }

    }
  })
);
// Conexión MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "uts_tesinas"
});

db.connect((err) => {
  if (err) {
    console.error("Error al conectar a MySQL:", err);
    return;
  }
  console.log("Conectado a MySQL");
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });



// Registro de alumnos
app.post("/api/registro", (req, res) => {
  const { matricula, nombre, carrera, cuatrimestre, password } = req.body;

  const sql = `
    INSERT INTO usuarios (usuario, nombre, password, rol, carrera, cuatrimestre)
    VALUES (?, ?, ?, 'alumno', ?, ?)
  `;

  db.query(
    sql,
    [matricula, nombre, password, carrera, cuatrimestre],
    (err) => {
      if (err) {
        return res.status(500).json({ message: "Error al registrar" });
      }

      res.json({ message: "Alumno registrado correctamente" });
    }
  );
});

app.post("/api/revertir/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
UPDATE entregas
SET estado = 'pendiente',
    errores = NULL,
    calificacion_sistema = NULL,
    observaciones = NULL
WHERE id = ?
`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al revertir:", err);
      return res.status(500).json({ error: "Error en servidor" });
    }

    res.json({ mensaje: "Tesina regresada a pendiente" });
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { matricula, password } = req.body;

  if (!matricula || !password) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos"
    });
  }

 const sql = `
  SELECT 
    u.id,
    u.usuario,
    u.nombre,
    u.rol,
    c.nombre AS carrera,
    u.cuatrimestre
  FROM usuarios u
  LEFT JOIN carreras c ON u.carrera = c.id
  WHERE TRIM(LOWER(u.usuario)) = ?
  AND u.password = ?
`;
  db.query(
    sql,
    [matricula.trim().toLowerCase(), password],
    (err, results) => {
      if (err) {
        console.error("❌ Error SQL login:", err);
        return res.status(500).json({
          success: false,
          message: "Error al iniciar sesión"
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Usuario o contraseña incorrectos"
        });
      }

      const user = results[0];

      return res.json({
        success: true,
        user: {
          id: user.id,
          usuario: user.usuario,
          nombre: user.nombre,
          rol: user.rol,
          carrera: user.carrera,
          cuatrimestre: user.cuatrimestre
        }
      });
    }
  );
});


app.put("/api/cambiar-password", (req, res) => {

  console.log("===== CAMBIAR PASSWORD =====");
  console.log("BODY:", req.body);

  const { usuario, passwordActual, passwordNueva } = req.body;

  console.log("Usuario:", usuario);
  console.log("Password actual:", passwordActual);
  console.log("Password nueva:", passwordNueva);

  const sql = `
    SELECT * FROM usuarios
    WHERE usuario = ?
    AND password = ?
  `;

  db.query(
    sql,
    [usuario, passwordActual],
    (err, results) => {

      if (err) {
        console.error("ERROR SQL:", err);
        return res.status(500).json({
          success: false,
          message: "Error del servidor"
        });
      }

      console.log("Resultados encontrados:", results.length);

      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: "La contraseña actual es incorrecta"
        });
      }

      const updateSql = `
        UPDATE usuarios
        SET password = ?
        WHERE usuario = ?
      `;

      db.query(
        updateSql,
        [passwordNueva, usuario],
        (err) => {

          if (err) {
            console.error("ERROR UPDATE:", err);
            return res.status(500).json({
              success: false,
              message: "Error al actualizar contraseña"
            });
          }

          console.log("✅ Contraseña actualizada");

          res.json({
            success: true,
            message: "Contraseña actualizada correctamente"
          });

        }
      );

    }
  );

});




// Obtener todas las tareas
app.post("/api/tareas", upload.single("archivo"), (req, res) => {
  const { titulo, instrucciones, docente_id, fecha_entrega } = req.body;
  const archivo = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO tareas (titulo, instrucciones, docente_id, archivo, fecha_entrega)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
  sql,
  [titulo, instrucciones, docente_id, archivo, fecha_entrega],
  (err) => {
    
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error al crear tarea" });
    }

    res.json({ message: "Tarea creada correctamente" });
  });
});

app.get("/api/tareas", (req, res) => {
  const sql = `
    SELECT 
      t.*, 
      u.nombre AS autor
    FROM tareas t
    JOIN usuarios u ON t.docente_id = u.id
    ORDER BY t.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener tareas:", err);
      return res.status(500).json({ message: "Error al obtener tareas" });
    }

    res.json(results);
  });
});

// Entregar tarea
app.post("/api/entregas", upload.single("archivo"), (req, res) => {
  const { tarea_id, alumno_id } = req.body;
  const archivo = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO entregas (tarea_id, alumno_id, archivo)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [tarea_id, alumno_id, archivo], (err) => {

    if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error al entregar tarea" });
    }

    // Obtener el nombre del alumno
    const sqlAlumno = `
        SELECT nombre
        FROM usuarios
        WHERE id = ?
    `;

    db.query(sqlAlumno, [alumno_id], (err2, alumno) => {

        if (!err2 && alumno.length > 0) {

            const titulo = "Nueva tesina subida";

            const mensaje = `${alumno[0].nombre} subió una tesina para revisión.`;

            // Aquí cambia el 2 por el id del docente correspondiente
            const docente_id = 2;

            const sqlNotificacion = `
                INSERT INTO notificaciones
                (titulo, mensaje, tipo, usuario_id)
                VALUES (?, ?, 'normal', ?)
            `;

            db.query(
                sqlNotificacion,
                [titulo, mensaje, docente_id]
            );

        }

        res.json({
            message: "Entrega realizada correctamente"
        });

    });

});
});

// Verificar si alumno ya entregó
app.get("/api/entregas/:tarea_id/:alumno_id", (req, res) => {
  const { tarea_id, alumno_id } = req.params;

  const sql = `
    SELECT * FROM entregas
    WHERE tarea_id = ? AND alumno_id = ?
  `;

  db.query(sql, [tarea_id, alumno_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ entregado: false });
    }

    if (results.length > 0) {
      return res.json({
        entregado: true,
        entrega: results[0]
      });
    }

    res.json({ entregado: false });
  });
});

// Anular entrega
app.delete("/api/entregas/:tarea_id/:alumno_id", (req, res) => {
  const { tarea_id, alumno_id } = req.params;

  const sql = `
    DELETE FROM entregas
    WHERE tarea_id = ? AND alumno_id = ?
  `;

  db.query(sql, [tarea_id, alumno_id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error al anular entrega" });
    }

    res.json({ message: "Entrega anulada correctamente" });
  });
});

// Obtener todas las entregas (vista docente)
app.get("/api/entregas", (req, res) => {
  const sql = `
SELECT 
    e.id,
    u.nombre AS alumno_nombre,
    t.titulo,
    c.nombre AS carrera,
    e.archivo,
    e.archivo_observaciones,
    e.fecha_entrega,
    e.estado,
    e.errores,
    e.calificacion_sistema,
    e.observaciones
FROM entregas e
JOIN usuarios u ON e.alumno_id = u.id
JOIN tareas t ON e.tarea_id = t.id
LEFT JOIN carreras c ON u.carrera = c.id
ORDER BY e.id DESC
`;


db.query(sql, (err, results) => {

    if (err) {
        console.error("Error al obtener entregas:", err);
        return res.status(500).json({ message: "Error al obtener entregas" });
    }

    console.log("COLUMNAS QUE ENVIA API:", results[0]);

    res.json(results);
});
});

app.post("/api/analizar/:id", async (req, res) => {

  const { id } = req.params;

  const sqlBuscar = "SELECT * FROM entregas WHERE id = ?";

  db.query(sqlBuscar, [id], async (err, result) => {

    if (err) {
      return res.status(500).json({ message: "Error al buscar archivo" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Entrega no encontrada" });
    }

    // SI YA ESTÁ ANALIZADO NO SE VUELVE A ANALIZAR
    if (result[0].estado === "analizado") {
      return res.json({
        errores: result[0].errores,
        calificacion: result[0].calificacion_sistema,
        observaciones: result[0].observaciones
      });
    }

    /*

// SIMULACIÓN DE ANÁLISIS
let errores = Math.floor(Math.random() * 5);

let observaciones = [];

if (errores >= 1) {
  observaciones.push("El título no está en mayúsculas");
}

if (errores >= 2) {
  observaciones.push("Espaciado incorrecto en algunas páginas");
}

if (errores >= 3) {
  observaciones.push("Falta sección de conclusiones");
}

let calificacion = 10 - errores;

*/

// Ruta del documento que subió el alumno
const rutaArchivo = path.join(__dirname, "../uploads", result[0].archivo);

console.log("RUTA DEL ARCHIVO:");
console.log(rutaArchivo);

// 🔥 ANALIZAR TESINA (YA INCLUYE ERRORES DE FORMATO Y MÁRGENES)
const analisis = await analizarTesina(rutaArchivo);

console.log("===== RESULTADO DEL ANALIZADOR =====");
console.log(JSON.stringify(analisis, null, 2));

// 🔥 SOLO USAR LOS ERRORES DE analisis (NO duplicar)
let observaciones = analisis.errores || [];

// 🔥 ELIMINAR DUPLICADOS POR MENSAJE (POR SI ACASO)
const observacionesUnicas = [];
const mensajesVistos = new Set();

observaciones.forEach(obs => {
    const mensajeKey = obs.mensaje ? obs.mensaje.trim() : '';
    if (mensajeKey && !mensajesVistos.has(mensajeKey)) {
        mensajesVistos.add(mensajeKey);
        observacionesUnicas.push(obs);
    }
});

observaciones = observacionesUnicas;

let cantidadErrores = observaciones.length;

// Convertir arreglo a texto para MySQL
let observacionesTexto = observaciones
    .map(o => o.mensaje)
    .join("\n");

let calificacion = 10;

// Restar un punto por cada error encontrado
calificacion -= cantidadErrores;

if (calificacion < 0) {
    calificacion = 0;
}

// Obtiene el nombre original eliminando cualquier "observado_" repetido
const nombreOriginal = result[0].archivo.replace(/^(observado_)+/, "");

// Siempre genera el mismo nombre
const archivoNuevo = "observado_" + nombreOriginal;

// Ruta donde se guardará el documento
const rutaNuevoDoc = path.join(__dirname, "../uploads", archivoNuevo);

console.log("Analizando entrega:", id);
console.log("Archivo actual:", result[0].archivo);
console.log("Nuevo archivo:", archivoNuevo);

console.log("Generando Word con comentarios...");
console.log("📝 COMENTARIOS A INSERTAR:", JSON.stringify(observaciones, null, 2));
console.log("📝 CANTIDAD DE COMENTARIOS:", observaciones.length);

await insertarComentariosWord(
    path.join(__dirname, "../uploads", result[0].archivo),
    rutaNuevoDoc,
    observaciones
);

console.log("Word con comentarios generado correctamente.");


    const sqlActualizar = `
    UPDATE entregas
    SET errores = ?,
        calificacion_sistema = ?,
        observaciones = ?,
        archivo_observaciones = ?,
        estado = 'analizado'
    WHERE id = ?`;


    db.query(
        sqlActualizar,
       [
    cantidadErrores,
    calificacion,
    observacionesTexto,
    archivoNuevo,
    id
],
        (err) => {

            if (err) {
                console.log("ERROR MYSQL:", err);

                return res.status(500).json({
                    message: "Error al guardar análisis"
                });
            }


            console.log("ANÁLISIS GUARDADO CORRECTAMENTE");


          res.json({
    errores: cantidadErrores,
    calificacion,
    observaciones,
    archivo_observaciones: archivoNuevo
});

        }
    );

});


// Obtener notificaciones por usuario
app.get("/api/notificaciones/:usuario_id", (req, res) => {

    const { usuario_id } = req.params;

    const sql = `
        SELECT *
        FROM notificaciones
        WHERE usuario_id = ?
        ORDER BY fecha DESC
    `;

    db.query(sql, [usuario_id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Error al obtener notificaciones"
            });
        }

        res.json(results);

    });

});
})

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
