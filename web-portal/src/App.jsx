import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DoctorDashboard from "./pages/DoctorDashboard";
import LabDashboard from "./pages/LabDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import UploadReport from "./pages/UploadReport";
import Chatbot from "./pages/Chatbot";
import FindDoctors from "./pages/FindDoctors";
import Appointments from "./pages/Appointments";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/lab" element={<LabDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/upload" element={<UploadReport />} />
        <Route path="/patient/chatbot" element={<Chatbot />} />
        <Route path="/patient/doctors" element={<FindDoctors />} />
        <Route path="/patient/appointments" element={<Appointments />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;