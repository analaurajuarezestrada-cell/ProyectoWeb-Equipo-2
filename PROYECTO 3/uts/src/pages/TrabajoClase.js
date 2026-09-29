import React, { useState } from "react";
import "./TrabajoClase.css";


export default function TrabajoClase() {
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [instrucciones, setInstrucciones] = useState("");
  const [archivo, setArchivo] = useState(null); // 🔥 nuevo estado para PDF

  const publicarTarea = async () => {
    try {
      const docente_id = localStorage.getItem("userId");

      if (!docente_id) {
        alert("No hay sesión iniciada. Vuelve a iniciar sesión.");
        return;
      }

      if (!titulo || !instrucciones || !fechaEntrega) {
        alert("Completa todos los campos");
        return;
      }

      if (!archivo) {
        alert("Debes subir el PDF de instrucciones");
        return;
      }

      // 🔥 Usamos FormData
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("instrucciones", instrucciones);
      formData.append("docente_id", Number(docente_id));
      formData.append("fecha_entrega", fechaEntrega);
      formData.append("archivo", archivo);

      const response = await fetch("http://localhost:5000/api/tareas", {
        method: "POST",
        body: formData, // ⚠️ SIN headers
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Error al crear tarea");
        return;
      }

      alert("Tarea creada correctamente ✅");

      setTitulo("");
      setInstrucciones("");
      setArchivo(null);
      setFechaEntrega("");
      setMostrarFormulario(false);

    } catch (error) {
      console.error("Error real:", error);
      alert("Error de conexión con el servidor");
    }
  };

  return (
    <div className="trabajo-container">
      <h1>Trabajo de clase</h1>
      <p className="trabajo-subtitle">
        Crea y administra tareas para los alumnos
      </p>

      <button
        className="btn-crear"
        onClick={() => setMostrarFormulario(true)}
      >
        + Crear
      </button>

      {mostrarFormulario && (
        <div className="tarea-card">
          <h3>Nueva tarea</h3>

          <div className="form-group">
            <label>Título</label>
            <input
              type="text"
              placeholder="Título de la tarea"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Instrucciones</label>
            <textarea
              placeholder="Escribe instrucciones cortas"
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group">
  <label>Fecha de entrega</label>

  <input
    type="datetime-local"
    value={fechaEntrega}
    onChange={(e) => setFechaEntrega(e.target.value)}
  />
</div>

          {/* 🔥 NUEVO INPUT PARA PDF */}
          <div className="form-group">
            <label>Subir PDF de instrucciones completas</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setArchivo(e.target.files[0])}
            />
          </div>

          <div className="acciones">
            <button
              className="btn-cancelar"
              onClick={() => setMostrarFormulario(false)}
            >
              Cancelar
            </button>

            <button className="btn-publicar" onClick={publicarTarea}>
              Publicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}