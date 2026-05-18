import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import WorldsPage from '@/pages/WorldsPage';
import WorldDetailPage from '@/pages/WorldDetailPage';
import EntitiesPage from '@/pages/EntitiesPage';
import GraphPage from '@/pages/GraphPage';
import MembersPage from '@/pages/MembersPage';
import StatsPage from '@/pages/StatsPage';
import EntityDetailPage from '@/pages/EntityDetailPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { AppShell } from '@/components/layout/AppShell';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<WorldsPage />} />
          <Route path="/worlds/:worldId" element={<WorldDetailPage />}>
            <Route index element={<EntitiesPage />} />
            <Route path="graph" element={<GraphPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="stats" element={<StatsPage />} />
          </Route>
          <Route path="/worlds/:worldId/entities/:entityId" element={<EntityDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </>,
  ),
);
