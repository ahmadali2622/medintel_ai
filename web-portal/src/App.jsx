import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/doctor" element={<div style={{ padding: 40 }}>Doctor Dashboard (coming next)</div>} />
        <Route path="/lab" element={<div style={{ padding: 40 }}>Lab Dashboard (coming next)</div>} />
        <Route path="/admin" element={<div style={{ padding: 40 }}>Admin Dashboard (coming next)</div>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;