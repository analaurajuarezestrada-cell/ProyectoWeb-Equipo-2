import React from "react";
import "./NotificacionesAlumno.css";

export default function NotificacionesAlumno() {
  const notificaciones = [
    {
      id: 1,
      tipo: "urgente",
      titulo: "Entrega vencida",
      mensaje: "Tu tesina alcanzó la fecha límite de entrega.",
      fecha: "04/02/2026"
    },
    {
      id: 2,
      tipo: "normal",
      titulo: "Tesina corregida",
      mensaje: "El docente revisó tu tesina. Revisa las observaciones.",
      fecha: "03/02/2026"
    },
    {
      id: 3,
      tipo: "normal",
      titulo: "Aviso académico",
      mensaje: "Consulta el calendario académico actualizado.",
      fecha: "01/02/2026"
    }
  ];

  return (
    <div className="notif-alumno-container">
      <h2>🔔 Notificaciones – Alumno</h2>

      <div className="notif-list">
        {notificaciones.map((n) => (
          <div
            key={n.id}
            className={`notif-card ${n.tipo === "urgente" ? "urgente" : ""}`}
          >
            <div className="notif-header">
              <span className="notif-title">{n.titulo}</span>
              <span className="notif-date">{n.fecha}</span>
            </div>
            <p className="notif-message">{n.mensaje}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
