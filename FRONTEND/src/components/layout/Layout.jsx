import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] px-4 py-8 sm:px-8">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}