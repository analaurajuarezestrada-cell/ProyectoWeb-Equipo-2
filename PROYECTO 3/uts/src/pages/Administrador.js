import React from "react";
import {
  FaUsersCog,
  FaKey,
  FaBell,
  FaUserShield
} from "react-icons/fa";

import "./Administrador.css";

export default function Administrador({ cambiarVista }) {
  return (
    <div className="admin-section">
      <p className="sidebar-title">Administración</p>

      <ul className="sidebar-menu">
        <li onClick={() => cambiarVista("gestion-usuarios")}>
          <FaUsersCog className="sidebar-icon" />
          <span>Gestión de usuarios</span>
        </li>

        <li onClick={() => cambiarVista("credenciales-roles")}>
          <FaKey className="sidebar-icon" />
          <span>Credenciales y roles</span>
        </li>

        <li onClick={() => cambiarVista("notificaciones-admin")}>
          <FaBell className="sidebar-icon" />
          <span>Notificaciones del sistema</span>
        </li>

        <li onClick={() => cambiarVista("perfil-admin")}>
          <FaUserShield className="sidebar-icon" />
          <span>Perfil</span>
        </li>
      </ul>
    </div>
  );
}
