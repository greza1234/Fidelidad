// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login2.jsx";               //  usa Login2.jsx
import ClientHome from "./pages/client/ClientHome.jsx";
import StaffHome from "./pages/staff/StaffHome.jsx";
import StaffAdd from "./pages/staff/StaffAdd.jsx";
import CompleteProfile from "./pages/CompleteProfile.jsx";



export default function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/" element={<Login />} />

      {/* Cliente */}
      <Route path="/client" element={<ClientHome />} />

      {/* Staff */}
      <Route path="/staff" element={<StaffHome />} />

      {/* pantalla para añadir sellos después de escanear */}
      <Route path="/staff/add/:userId" element={<StaffAdd />} />

      <Route path="/complete-profile" element={<CompleteProfile />} />

    </Routes>
  );
}
