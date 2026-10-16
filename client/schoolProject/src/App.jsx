import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import Checkout from "./pages/Checkout.jsx";
import Gallery from "./pages/Gallery.jsx";
import Contact from "./pages/Contact.jsx";
import AdmissionForm from "./pages/AdmissionForm.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import StudentLayout from "./components/StudentLayout.jsx";
import Dashboard from "./pages/student/Dashboard.jsx";
import StudentCourses from "./pages/student/StudentCourses.jsx";
import CourseLearning from "./pages/student/CourseLearning.jsx";
import Profile from "./pages/student/Profile.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" in window.HTMLElement.prototype ? "instant" : "auto" });
  }, [pathname]);
  return null;
}

// Routes that should render as a bare "app shell" — no marketing header/footer.
function isChromeless(pathname) {
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/checkout/")) return true;
  if (/^\/courses\/[^/]+$/.test(pathname)) return true; // /courses/:id, but not /courses itself
  return false;
}

export default function App() {
  const { pathname } = useLocation();
  const hideChrome = isChromeless(pathname);

  return (
    <div className="site">
      <ScrollToTop />
      {!hideChrome && <Navbar />}
      <main className={hideChrome ? "main--dashboard" : undefined}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route
            path="/checkout/:id"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admissions" element={<AdmissionForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <StudentLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="courses/:id/learn" element={<CourseLearning />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
}