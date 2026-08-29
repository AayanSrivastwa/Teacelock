import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import Manufacturer from "./pages/Manufacturer";
import Verify from "./pages/verify";
import QRScanner from "./components/Qrscanner";
function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">TeaceLock</Link>
        {" | "}
        <Link to="/manufacturer">
          Manufacturer
        </Link>

        {" | "}
        <Link to="/scan">
          Scan QR
        </Link>

        {" | "}
        
        <Link to="/verify">
          Verify
        </Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <h1>Welcome to TeaceLock 🔐</h1>
          }
        />

        <Route
          path="/manufacturer"
          element={<Manufacturer />}
        />
        <Route
          path="/scan"
          element={<QRScanner />}
        />
      <Route
        path="/verify"
        element={<Verify />}
      />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

