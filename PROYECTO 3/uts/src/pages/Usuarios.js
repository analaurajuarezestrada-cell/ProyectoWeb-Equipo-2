import React, { useEffect, useMemo, useState } from "react";
import {
  FaUsers,
  FaSearch,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUserShield,
  FaExchangeAlt,
  FaSyncAlt
} from "react-icons/fa";

import "./Usuarios.css";

export default function Usuarios() {
  const API = "http://localhost:5000/api";

  const adminId = Number(localStorage.getItem("userId"));
  const rolActual = localStorage.getItem("userRole");

  // ======================================================
  // ESTADOS
  // ======================================================

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  const [rolesSeleccionados, setRolesSeleccionados] =
    useState({});

  const [mensaje, setMensaje] = useState("");

  // ======================================================
  // CARGAR USUARIOS
  // ======================================================

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setMensaje("");

      const respuesta = await fetch(
        `${API}/admin/usuarios`
      );

      const data = await respuesta.json();

      if (!respuesta.ok || !data.success) {
        throw new Error(
          data.message ||
            "No se pudieron cargar los usuarios"
        );
      }

      const lista = data.usuarios || [];

      setUsuarios(lista);

      const rolesIniciales = {};

      lista.forEach((usuario) => {
        rolesIniciales[usuario.id] = usuario.rol;
      });

      setRolesSeleccionados(rolesIniciales);
    } catch (error) {
      console.error(
        "Error al cargar usuarios:",
        error
      );

      setMensaje(
        `❌ ${
          error.message ||
          "Error al cargar los usuarios"
        }`
      );
    } finally {
      setCargando(false);
    }
  };

  // ======================================================
  // CARGAR AL ENTRAR
  // ======================================================

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // ======================================================
  // USUARIOS FILTRADOS
  // ======================================================

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    return usuarios.filter((usuario) => {
      const coincideRol =
        filtroRol === "todos" ||
        usuario.rol === filtroRol;

      const coincideBusqueda =
        !texto ||
        (usuario.nombre || "")
          .toLowerCase()
          .includes(texto) ||
        (usuario.usuario || "")
          .toLowerCase()
          .includes(texto) ||
        (usuario.carrera || "")
          .toLowerCase()
          .includes(texto);

      return coincideRol && coincideBusqueda;
    });
  }, [usuarios, busqueda, filtroRol]);

  // ======================================================
  // CONTADORES
  // ======================================================

  const totalUsuarios = usuarios.length;

  const totalAlumnos = usuarios.filter(
    (usuario) => usuario.rol === "alumno"
  ).length;

  const totalDocentes = usuarios.filter(
    (usuario) => usuario.rol === "docente"
  ).length;

  const totalAdmins = usuarios.filter(
    (usuario) => usuario.rol === "admin"
  ).length;

  // ======================================================
  // CAMBIAR SELECT LOCAL
  // ======================================================

  const cambiarSelectRol = (
    usuarioId,
    nuevoRol
  ) => {
    setRolesSeleccionados((actuales) => ({
      ...actuales,
      [usuarioId]: nuevoRol
    }));
  };

  // ======================================================
  // CANCELAR CAMBIO
  // ======================================================

  const cancelarCambio = (usuario) => {
    setRolesSeleccionados((actuales) => ({
      ...actuales,
      [usuario.id]: usuario.rol
    }));
  };

  // ======================================================
  // GUARDAR CAMBIO DE ROL
  // ======================================================

  const cambiarRol = async (usuario) => {
    if (rolActual !== "admin" || !adminId) {
      setMensaje(
        "❌ Solamente un administrador puede cambiar roles."
      );

      return;
    }

    const nuevoRol =
      rolesSeleccionados[usuario.id];

    if (!nuevoRol) {
      setMensaje(
        "❌ Selecciona un rol válido."
      );

      return;
    }

    if (nuevoRol === usuario.rol) {
      setMensaje(
        "ℹ️ El usuario ya tiene ese rol."
      );

      return;
    }

    const nombreRolActual =
      usuario.rol === "admin"
        ? "ADMINISTRADOR"
        : usuario.rol.toUpperCase();

    const nombreRolNuevo =
      nuevoRol === "admin"
        ? "ADMINISTRADOR"
        : nuevoRol.toUpperCase();

    const confirmar = window.confirm(
      `¿Deseas cambiar el rol de ${usuario.nombre}?\n\n` +
        `${nombreRolActual} → ${nombreRolNuevo}\n\n` +
        "Al cambiar el rol se eliminarán los permisos anteriores de este usuario."
    );

    if (!confirmar) {
      cancelarCambio(usuario);
      return;
    }

    try {
      setGuardandoId(usuario.id);
      setMensaje("");

      const respuesta = await fetch(
        `${API}/admin/usuarios/${usuario.id}/rol`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            nuevoRol,
            adminId
          })
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok || !data.success) {
        throw new Error(
          data.message ||
            "No se pudo cambiar el rol"
        );
      }

      setMensaje(
        `✅ ${usuario.nombre} ahora tiene el rol ${nombreRolNuevo}.`
      );

      await cargarUsuarios();
    } catch (error) {
      console.error(
        "Error al cambiar rol:",
        error
      );

      cancelarCambio(usuario);

      setMensaje(
        `❌ ${
          error.message ||
          "No se pudo cambiar el rol"
        }`
      );
    } finally {
      setGuardandoId(null);
    }
  };

  // ======================================================
  // ICONO SEGÚN ROL
  // ======================================================

  const obtenerIconoRol = (rol) => {
    if (rol === "admin") {
      return <FaUserShield />;
    }

    if (rol === "docente") {
      return <FaChalkboardTeacher />;
    }

    return <FaUserGraduate />;
  };

  // ======================================================
  // NOMBRE DEL ROL
  // ======================================================

  const obtenerNombreRol = (rol) => {
    if (rol === "admin") {
      return "Administrador";
    }

    if (rol === "docente") {
      return "Docente";
    }

    return "Alumno";
  };

  // ======================================================
  // SEGURIDAD VISUAL
  // ======================================================

  if (rolActual !== "admin") {
    return (
      <div className="usuarios-page">
        <div className="usuarios-no-autorizado">
          <FaUserShield />

          <h2>Acceso restringido</h2>

          <p>
            Esta sección solamente está disponible
            para administradores.
          </p>
        </div>
      </div>
    );
  }

  // ======================================================
  // INTERFAZ
  // ======================================================

  return (
    <div className="usuarios-page">
      {/* ===============================================
          ENCABEZADO
      =============================================== */}

      <div className="usuarios-header">
        <div className="usuarios-header-info">
          <div className="usuarios-header-icon">
            <FaUsers />
          </div>

          <div>
            <h1>Usuarios</h1>

            <p>
              Consulta todos los usuarios registrados
              y administra sus roles.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="usuarios-btn-recargar"
          onClick={cargarUsuarios}
          disabled={cargando}
        >
          <FaSyncAlt />

          {cargando
            ? "Actualizando..."
            : "Actualizar"}
        </button>
      </div>

      {/* ===============================================
          MENSAJE
      =============================================== */}

      {mensaje && (
        <div
          className={`usuarios-mensaje ${
            mensaje.startsWith("✅")
              ? "exito"
              : mensaje.startsWith("ℹ️")
              ? "info"
              : "error"
          }`}
        >
          {mensaje}
        </div>
      )}

      {/* ===============================================
          CONTADORES
      =============================================== */}

      <div className="usuarios-estadisticas">
        <div className="usuarios-estadistica total">
          <div className="usuarios-estadistica-icon">
            <FaUsers />
          </div>

          <div>
            <strong>{totalUsuarios}</strong>
            <span>Usuarios</span>
          </div>
        </div>

        <div className="usuarios-estadistica alumnos">
          <div className="usuarios-estadistica-icon">
            <FaUserGraduate />
          </div>

          <div>
            <strong>{totalAlumnos}</strong>
            <span>Alumnos</span>
          </div>
        </div>

        <div className="usuarios-estadistica docentes">
          <div className="usuarios-estadistica-icon">
            <FaChalkboardTeacher />
          </div>

          <div>
            <strong>{totalDocentes}</strong>
            <span>Docentes</span>
          </div>
        </div>

        <div className="usuarios-estadistica admins">
          <div className="usuarios-estadistica-icon">
            <FaUserShield />
          </div>

          <div>
            <strong>{totalAdmins}</strong>
            <span>Administradores</span>
          </div>
        </div>
      </div>

      {/* ===============================================
          HERRAMIENTAS
      =============================================== */}

      <div className="usuarios-herramientas">
        <div className="usuarios-buscador">
          <FaSearch />

          <input
            type="text"
            value={busqueda}
            placeholder="Buscar por nombre, usuario o carrera..."
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
          />
        </div>

        <div className="usuarios-filtros">
          <button
            type="button"
            className={
              filtroRol === "todos"
                ? "activo"
                : ""
            }
            onClick={() =>
              setFiltroRol("todos")
            }
          >
            Todos
          </button>

          <button
            type="button"
            className={
              filtroRol === "alumno"
                ? "activo"
                : ""
            }
            onClick={() =>
              setFiltroRol("alumno")
            }
          >
            Alumnos
          </button>

          <button
            type="button"
            className={
              filtroRol === "docente"
                ? "activo"
                : ""
            }
            onClick={() =>
              setFiltroRol("docente")
            }
          >
            Docentes
          </button>

          <button
            type="button"
            className={
              filtroRol === "admin"
                ? "activo"
                : ""
            }
            onClick={() =>
              setFiltroRol("admin")
            }
          >
            Administradores
          </button>
        </div>
      </div>

      {/* ===============================================
          TABLA
      =============================================== */}

      <div className="usuarios-card">
        <div className="usuarios-card-header">
          <div>
            <h2>Usuarios registrados</h2>

            <p>
              {usuariosFiltrados.length} resultado(s)
            </p>
          </div>
        </div>

        {cargando ? (
          <div className="usuarios-cargando">
            <FaSyncAlt className="usuarios-spinner" />

            <span>
              Cargando usuarios...
            </span>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="usuarios-vacio">
            <FaUsers />

            <h3>No hay usuarios</h3>

            <p>
              No se encontraron usuarios con
              los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="usuarios-tabla-contenedor">
            <table className="usuarios-tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Carrera</th>
                  <th>Cuatrimestre</th>
                  <th>Rol actual</th>
                  <th>Cambiar rol</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.map(
                  (usuario) => {
                    const rolTemporal =
                      rolesSeleccionados[
                        usuario.id
                      ] || usuario.rol;

                    const tieneCambios =
                      rolTemporal !==
                      usuario.rol;

                    const guardando =
                      guardandoId ===
                      usuario.id;

                    return (
                      <tr key={usuario.id}>
                        {/* USUARIO */}

                        <td>
                          <div className="usuarios-persona">
                            <div
                              className={`usuarios-avatar ${usuario.rol}`}
                            >
                              {usuario.nombre
                                ? usuario.nombre
                                    .charAt(0)
                                    .toUpperCase()
                                : "U"}
                            </div>

                            <div className="usuarios-persona-datos">
                              <strong>
                                {usuario.nombre}
                              </strong>

                              <span>
                                {usuario.usuario}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* CARRERA */}

                        <td>
                          {usuario.carrera ? (
                            <span className="usuarios-carrera">
                              {usuario.carrera}
                            </span>
                          ) : (
                            <span className="usuarios-sin-dato">
                              —
                            </span>
                          )}
                        </td>

                        {/* CUATRIMESTRE */}

                        <td>
                          {usuario.cuatrimestre ? (
                            <span>
                              {usuario.cuatrimestre}
                            </span>
                          ) : (
                            <span className="usuarios-sin-dato">
                              —
                            </span>
                          )}
                        </td>

                        {/* ROL ACTUAL */}

                        <td>
                          <span
                            className={`usuarios-rol-badge ${usuario.rol}`}
                          >
                            {obtenerIconoRol(
                              usuario.rol
                            )}

                            {obtenerNombreRol(
                              usuario.rol
                            )}
                          </span>
                        </td>

                        {/* CAMBIAR ROL */}

                        <td>
                          <select
                            className={`usuarios-select-rol ${
                              tieneCambios
                                ? "modificado"
                                : ""
                            }`}
                            value={rolTemporal}
                            disabled={guardando}
                            onChange={(event) =>
                              cambiarSelectRol(
                                usuario.id,
                                event.target.value
                              )
                            }
                          >
                            <option value="alumno">
                              Alumno
                            </option>

                            <option value="docente">
                              Docente
                            </option>

                            <option value="admin">
                              Administrador
                            </option>
                          </select>
                        </td>

                        {/* ACCIÓN */}

                        <td>
                          <div className="usuarios-acciones">
                            <button
                              type="button"
                              className="usuarios-btn-cambiar"
                              disabled={
                                !tieneCambios ||
                                guardando
                              }
                              onClick={() =>
                                cambiarRol(usuario)
                              }
                            >
                              <FaExchangeAlt />

                              {guardando
                                ? "Guardando..."
                                : "Cambiar"}
                            </button>

                            {tieneCambios &&
                              !guardando && (
                                <button
                                  type="button"
                                  className="usuarios-btn-cancelar"
                                  onClick={() =>
                                    cancelarCambio(
                                      usuario
                                    )
                                  }
                                  title="Cancelar cambio"
                                >
                                  ×
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===============================================
          AVISO
      =============================================== */}

      <div className="usuarios-aviso">
        <FaUserShield />

        <div>
          <strong>
            Administración de roles
          </strong>

          <p>
            Cuando cambias el rol de un usuario,
            sus permisos anteriores son eliminados
            automáticamente para evitar permisos
            incompatibles con el nuevo rol.
          </p>
        </div>
      </div>
    </div>
  );
}