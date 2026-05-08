import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Home from "./components/Home";
import Messages from "./components/Messages";
import Gallery from "./components/Gallery";
import Timeline from "./components/Timeline";
import Extras from "./components/Extras";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/app",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "messages", Component: Messages },
      { path: "gallery", Component: Gallery },
      { path: "timeline", Component: Timeline },
      { path: "extras", Component: Extras },
    ],
  },
]);
