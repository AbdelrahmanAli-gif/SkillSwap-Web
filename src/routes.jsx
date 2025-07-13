import LandingPage from "./pages/Landing Page/LandingPage";
import { Login } from "./pages/Login";
import Register from "./pages/Register/Register";

const routes = [
  { path: "/", element: <Login /> },
  { path: "login", element: <Login /> },
  { path: "register", element: <Register /> },
  { path: "landing", element: <LandingPage /> },
];

export default routes;
