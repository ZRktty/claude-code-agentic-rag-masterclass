import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App";
import { ProtectedRoute } from "./lib/protected-route";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
