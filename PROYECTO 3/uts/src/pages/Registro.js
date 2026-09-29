import { useState } from "react";
import "./Registro.css";

const Registro = ({ goToLogin }) => {
  const [form, setForm] = useState({
    matricula: "",
    nombre: "",
    correo: "",
    carrera: "",
    cuatrimestre: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // ✅ Validar matrícula numérica
  if (!/^\d+$/.test(form.matricula)) {
    window.alert("La matrícula solo debe contener números");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      window.alert(data.message);
      setForm({
        matricula: "",
        nombre: "",
        correo: "",
        carrera: "",
        cuatrimestre: "",
        password: "",
      });
      goToLogin();
    } else {
      window.alert(data.message || "Error al registrar alumno");
    }
  } catch (error) {
    console.error(error);
    window.alert("Ocurrió un error al registrar el alumno");
  }
};

  return (
    <div className="registro-page">
      <div className="registro-container">
        <h1 className="registro-title">Registro de Alumno</h1>

        <form className="registro-form" onSubmit={handleSubmit}>
          <label>
            Matrícula
            <input
              type="text"
              name="matricula"
              value={form.matricula}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Nombre completo
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Correo (opcional)
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
            />
          </label>

          <label>
            Carrera
            <select
              name="carrera"
              value={form.carrera}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una carrera</option>
              <option value="1">Desarrollo y Gestión de Software</option>
              <option value="2">Ingeniería Civil</option>
              <option value="3">Contaduría</option>
              <option value="4">Gestión y Desarrollo Turístico</option>
              <option value="5">Agricultura Sustentable y Protegida</option>
            </select>
          </label>

          <label>
            Cuatrimestre
            <input
              type="number"
              name="cuatrimestre"
              min="1"
              max="10"
              value={form.cuatrimestre}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <button className="registro-button" type="submit">
            Registrarse
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registro;
