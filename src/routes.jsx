import LandingPage from "./pages/Landing Page/LandingPage";
import { Login } from "./pages/Login";

const routes = [
  { path: '/', element: <Login /> },
  { path: 'login', element: <Login /> },
  { path: 'landing', element: <LandingPage/> },
]

export default routes