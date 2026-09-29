import { useState } from "react";
import "./Asesorias.css";

const Asesorias = () => {
  const [dudas, setDudas] = useState([]);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    categoria: "Tesina",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const enviarDuda = (e) => {
    e.preventDefault();

    if (!form.titulo || !form.descripcion) {
      alert("Completa todos los campos");
      return;
    }

    const nuevaDuda = {
      id: Date.now(),
      ...form,
      estado: "Pendiente",
      fecha: new Date().toLocaleDateString(),
      asesor: "",
      respuesta: "",
    };

    setDudas([nuevaDuda, ...dudas]);
    setForm({ titulo: "", descripcion: "", categoria: "Tesina" });
  };

  return (
    <div className="asesorias-container">
      <h1>📚 Centro de Dudas y Asesorías</h1>

      {/* formulario */}
      <form className="asesorias-form" onSubmit={enviarDuda}>
        <h2>📝 Nueva duda</h2>

        <input
          type="text"
          name="titulo"
          placeholder="Título de la duda"
          value={form.titulo}
          onChange={handleChange}
        />

        <textarea
          name="descripcion"
          placeholder="Describe tu duda"
          value={form.descripcion}
          onChange={handleChange}
        ></textarea>

        <select
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
        >
          <option>Tesina</option>
          <option>Metodología</option>
          <option>Correcciones</option>
        </select>

        <button type="submit">Enviar duda</button>
      </form>

      {/* lista de dudas*/}
      <div className="asesorias-lista">
        <h2>📌 Mis dudas</h2>

        {dudas.length === 0 && (
          <p className="sin-dudas">No has enviado dudas aún.</p>
        )}

        {dudas.map((duda) => (
          <div key={duda.id} className="duda-card">
            <h3>{duda.titulo}</h3>
            <p className="categoria">{duda.categoria}</p>
            <p>{duda.descripcion}</p>

            <div className={`estado ${duda.estado.toLowerCase()}`}>
              {duda.estado}
            </div>

            <span className="fecha">📅 {duda.fecha}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Asesorias;
