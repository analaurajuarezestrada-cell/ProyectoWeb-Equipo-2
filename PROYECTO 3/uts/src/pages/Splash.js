import React, { useEffect, useState } from "react";
import "./Splash.css";
import logo from "../assets/UTS_logo.jpg"; 

export default function Splash({ onFinish }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onFinish(), 1200);
    }, 1800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`splash ${!visible ? "fade-out" : "fade-in"}`}>
      <img src={logo} alt="UT Selva Logo" className="splash-logo" />
    </div>
  );
}
