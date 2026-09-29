import React, { useEffect, useState } from "react";
import "./Perfil.css";

export default function Perfil() {

  const [user, setUser] = useState({
    nombre: "",
    usuario: "",
    carrera: "",
    rol: "Docente"
  });

  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);


const [passwordActual, setPasswordActual] = useState("");
const [passwordNueva, setPasswordNueva] = useState("");
const [confirmarPassword, setConfirmarPassword] = useState("");

  useEffect(() => {
    const nombre = localStorage.getItem("userName") || "";
    const usuario = localStorage.getItem("userUsuario") || "";
    const carrera = localStorage.getItem("userCarrera") || "";

    setUser({
      nombre,
      usuario,
      carrera,
      rol: "Docente"
    });

    setNuevoNombre(nombre);
  }, []);

  // 🔥 Guardar cambios
  const guardarCambios = () => {
    localStorage.setItem("userName", nuevoNombre);

    setUser({ ...user, nombre: nuevoNombre });
    setEditando(false);
  };
const cambiarPassword = async () => {

  if (!passwordActual || !passwordNueva || !confirmarPassword) {
    alert("Completa todos los campos");
    return;
  }

  if (passwordNueva !== confirmarPassword) {
    alert("Las contraseñas nuevas no coinciden");
    return;
  }

  try {

    const usuario =
      localStorage.getItem("userUsuario");

    const response = await fetch(
      "http://localhost:5000/api/cambiar-password",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario,
          passwordActual,
          passwordNueva
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    alert(data.message);

    setPasswordActual("");
    setPasswordNueva("");
    setConfirmarPassword("");

    setMostrarPassword(false);

  } catch (error) {

    console.error(error);

    alert("Error al conectar con el servidor");

  }

};

 return (
  <>
    <div className="perfil-card">

      <h2>👤 Perfil del Usuario</h2>

      <div className="perfil-info">

        <p><strong>Usuario:</strong> {user.usuario}</p>
        <p><strong>Carrera:</strong> {user.carrera}</p>
        <p><strong>Rol:</strong> {user.rol}</p>

        <div className="perfil-nombre">
          <strong>Nombre:</strong>

          {editando ? (
            <input
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
            />
          ) : (
            <span>{user.nombre}</span>
          )}
        </div>

      </div>

      <div className="perfil-actions">

        {editando ? (
          <>
            <button onClick={guardarCambios}>
              💾 Guardar
            </button>

            <button onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button onClick={() => setEditando(true)}>
            ✏️ Editar perfil
          </button>
        )}

        <button
          onClick={() => setMostrarPassword(true)}
        >
          🔐 Cambiar contraseña
        </button>

      </div>

    </div>

    {mostrarPassword && (
      <div className="modal-overlay">

        <div className="password-card">

          <div className="password-header">
            Cambiar contraseña
          </div>

          <div className="password-body">

            <div className="password-row">
              <label>Contraseña actual:</label>

              <input
                type="password"
                value={passwordActual}
                onChange={(e) =>
                  setPasswordActual(e.target.value)
                }
              />
            </div>

            <div className="password-row">
              <label>Nueva contraseña:</label>

              <input
                type="password"
                value={passwordNueva}
                onChange={(e) =>
                  setPasswordNueva(e.target.value)
                }
              />
            </div>

            <div className="password-row">
              <label>Confirmar contraseña:</label>

              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) =>
                  setConfirmarPassword(e.target.value)
                }
              />
            </div>

          </div>

          <div className="password-footer">

            <button
              className="btn-guardar-password"
              onClick={cambiarPassword}
            >
              Guardar
            </button>

            <button
              className="btn-cancelar-password"
              onClick={() => setMostrarPassword(false)}
            >
              Cancelar
            </button>

          </div>

        </div>

      </div>
    )}
  </>
);
}
