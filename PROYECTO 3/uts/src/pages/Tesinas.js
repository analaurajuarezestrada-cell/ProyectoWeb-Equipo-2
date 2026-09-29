import React, { useEffect, useState } from "react";
import "./Tesinas.css";

export default function Tesinas() {

  const [tesinas, setTesinas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const total = tesinas.length;

const pendientes = tesinas.filter(t => t.estado === "pendiente").length;

const analizados = tesinas.filter(t => t.estado === "analizado").length;

const promedio = tesinas.length > 0
  ? (
      tesinas
        .filter(t => t.calificacion_sistema)
        .reduce((acc, t) => acc + t.calificacion_sistema, 0) /
      tesinas.filter(t => t.calificacion_sistema).length
    ).toFixed(1)
  : 0;

  // 🔹 Cargar tesinas
  const cargarTesinas = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/entregas");

      const data = await res.json();
      console.log("DATOS QUE LLEGAN DE MYSQL:", data);

setTesinas(data);
    } catch (error) {
      console.error("Error cargando tesinas:", error);
    }
  };

  useEffect(() => {
    cargarTesinas();
  }, []);

  const volverACorregir = async (id) => {
  try {

    await fetch(`http://localhost:5000/api/revertir/${id}`, {
      method: "POST"
    });

    // 🔥 actualizar sin recargar todo
    setTesinas(prev =>
      prev.map(t =>
        t.id === id ? { ...t, estado: "pendiente" } : t
      )
    );

  } catch (error) {
    console.error("Error al revertir:", error);
  }
};

  const analizarDocumento = async (id) => {
  try {

    const res = await fetch(`http://localhost:5000/api/analizar/${id}`, {
      method: "POST"
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("ERROR DEL SERVIDOR:", error);
      alert("Ocurrió un error al analizar la tesina.");
      return;
    }

   const data = await res.json();

console.log("Respuesta:", data);

setTesinas(prev =>
  prev.map(t =>
    t.id === id
      ? {
          ...t,
          estado: "analizado",
          errores: data.errores,
          calificacion_sistema: data.calificacion,
          observaciones: data.observaciones,
          archivo_observaciones: data.archivo_observaciones
        }
      : t
  )
);

  } catch (error) {
    console.error("Error analizando:", error);
  }
};

  // 🔹 Descargar observaciones
 const descargarObservaciones = (archivo) => {

    console.log("ARCHIVO RECIBIDO EN DESCARGA:", archivo);

    if (!archivo) {
        console.log("NO EXISTE ARCHIVO DE OBSERVACIONES");
        return;
    }

    const url = `http://localhost:5000/uploads/${archivo}`;

    console.log("URL DE DESCARGA:", url);

    const link = document.createElement("a");
    link.href = url;
    link.download = archivo;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

  // 🔥 FILTRO COMPLETO
  const tesinasFiltradas = tesinas.filter((t) => {

    const coincideBusqueda =
      t.alumno_nombre.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "todos" || t.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  return (

    <div className="tesinas-container">

      <div className="tesinas-wrapper">

        <div className="header">
          <div className="cards">

  <div className="card total">
    <h3>{total}</h3>
    <p>Total Tesinas</p>
  </div>

  <div className="card pendientes">
    <h3>{pendientes}</h3>
    <p>Pendientes</p>
  </div>

  <div className="card analizados">
    <h3>{analizados}</h3>
    <p>Analizados</p>
  </div>

  <div className="card promedio">
    <h3>{promedio}</h3>
    <p>Promedio</p>
  </div>

</div>
          <h1>Gestión de Tesinas</h1>
          <p>Revisión y validación de documentos académicos</p>
        </div>

        {/* 🔥 FILTROS PRO */}
        <div className="filtros">

          <input
            placeholder="Buscar alumno..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="analizado">Analizado</option>
          </select>

        </div>

        {/* CONTADOR */}
        <p style={{ fontSize: "12px", color: "#6b7280" }}>
          Mostrando {tesinasFiltradas.length} registros
        </p>

        <div className="tesinas-table-container">

          <table className="tesinas-table">

            <thead>
              <tr>
                <th>Alumno</th>
                <th>Título</th>
                <th>Carrera</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Errores</th>
                <th>Calificación</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              {tesinasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center" }}>
                    No hay tesinas registradas
                  </td>
                </tr>
              ) : (

                tesinasFiltradas.map((tesina) => (

                  <tr key={tesina.id}>

                    <td>{tesina.alumno_nombre}</td>

                    <td>{tesina.titulo}</td>

                    <td>{tesina.carrera}</td>

                    <td>
                      {new Date(tesina.fecha_entrega).toLocaleDateString()}
                    </td>

                    <td>
                      <span className={`estado ${tesina.estado}`}>
                        {tesina.estado}
                      </span>
                    </td>

                    <td>{tesina.errores || 0}</td>

                    <td>{tesina.calificacion_sistema || "-"}</td>

                    <td>
  {tesina.observaciones ? (
   <button
  onClick={() => {
    console.log("TESINA:", JSON.stringify(tesina, null, 2));
    descargarObservaciones(tesina.archivo_observaciones);
  }}
>
  ⬇ Descargar
</button>
  ) : (
    "Sin observaciones"
  )}
</td>

                    <td>
                      <div className="acciones">

                        {tesina.estado === "analizado" ? (

  <button
    className="btn-revertir"
    onClick={() => volverACorregir(tesina.id)}
  >
    ↩ Volver a corregir
  </button>

) : (

  <button
    className="btn-analizar"
    onClick={() => analizarDocumento(tesina.id)}
  >
    🔍 Analizar
  </button>

)}

                      </div>
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );
}