import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Login } from "./components/auth/Login";
import { Signup } from "./components/auth/Signup";
import { Dashboard } from "./components/dashboard/Dashboard";
import { JobList } from "./components/jobs/JobList";
import { JobForm } from "./components/jobs/JobForm";
import { TestBuilder } from "./components/tests/TestBuilder";
import { CandidateTest } from "./components/candidates/CandidateTest";
import { CandidateList } from "./components/candidates/CandidateList";
import { Reports } from "./components/reports/Reports";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Login },
      { path: "signup", Component: Signup },
      { path: "dashboard", Component: Dashboard },
      { path: "jobs", Component: JobList },
      { path: "jobs/new", Component: JobForm },
      { path: "jobs/:jobId/edit", Component: JobForm },
      { path: "jobs/:jobId/test", Component: TestBuilder },
      { path: "jobs/:jobId/candidates", Component: CandidateList },
      { path: "test/:testId", Component: CandidateTest },
      { path: "reports", Component: Reports },
      { path: "*", Component: NotFound },
    ],
  },
]);
