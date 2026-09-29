import React from "react";
import {
  FaFolderOpen,
  FaFileAlt,
  FaEdit,
  FaCalendarAlt,
  FaBell,
  FaChartLine,
  FaUserCog,
} from "react-icons/fa";
import "./GestionDocente.css";

export default function GestionDocente({ cambiarVista }) {
  return (
    <div className="gestion-docente">
      <div className="gestion-docente-title">
        <FaFolderOpen className="icon" />
        <span>Gestión Docente</span>
      </div>

      <ul className="gestion-docente-list">
        <li onClick={() => cambiarVista("tesinas-asignadas")}>
          <FaFileAlt className="icon" />
          <span>Tesinas asignadas</span>
        </li>

        <li onClick={() => cambiarVista("correcciones")}>
          <FaEdit className="icon" />
          <span>Correcciones</span>
        </li>

        <li onClick={() => cambiarVista("calendario")}>
          <FaCalendarAlt className="icon" />
          <span>Calendario académico</span>
        </li>

        <li onClick={() => cambiarVista("notificaciones-docente")}>
          <FaBell className="icon" />
          <span>Notificaciones</span>
        </li>

        <li onClick={() => cambiarVista("seguimiento")}>
          <FaChartLine className="icon" />
          <span>Seguimiento de alumnos</span>
        </li>

        <li onClick={() => cambiarVista("perfil-docente")}>
          <FaUserCog className="icon" />
          <span>Perfil</span>
        </li>
      </ul>
    </div>
  );
}
