import { Navigate, Route, Routes } from "react-router-dom";

import { DisclaimerGate } from "./components/DisclaimerGate";
import { Layout } from "./components/Layout";
import { DorksPage } from "./routes/DorksPage";
import { ScanPage } from "./routes/ScanPage";
import { AnalysePage } from "./routes/AnalysePage";
import { DumperPage } from "./routes/DumperPage";
import { JobsPage } from "./routes/JobsPage";
import { SettingsPage } from "./routes/SettingsPage";

export default function App() {
  return (
    <DisclaimerGate>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dorks" replace />} />
          <Route path="/dorks" element={<DorksPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/analyse" element={<AnalysePage />} />
          <Route path="/dumper" element={<DumperPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dorks" replace />} />
        </Route>
      </Routes>
    </DisclaimerGate>
  );
}
