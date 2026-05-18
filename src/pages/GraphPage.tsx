import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import cytoscape from 'cytoscape';
import toast from 'react-hot-toast';
import {
  ZoomIn, ZoomOut, Maximize, Plus, GitBranch,
  AlertTriangle, X, ArrowRight,
} from 'lucide-react';
import { graphApi } from '@/api/graph';
import { entitiesApi } from '@/api/entities';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { getApiError } from '@/utils/errorHandler';
import { ENTITY_TYPE_COLORS } from '@/utils/constants';
import type { Entity, Edge, EdgeCreate, EntityType } from '@/types';

const edgeSchema = z.object({
  from_entity_id: z.string().min(1),
  to_entity_id:   z.string().min(1),
  label:          z.string().min(1, "Тип зв'язку обов'язковий"),
});
type EdgeFormData = z.infer<typeof edgeSchema>;

const pathSchema = z.object({
  from_id: z.string().min(1),
  to_id:   z.string().min(1),
});
type PathFormData = z.infer<typeof pathSchema>;

export default function GraphPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const qc = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [edgeModalOpen, setEdgeModalOpen] = useState(false);
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [conflictsOpen, setConflictsOpen] = useState(false);
  const [pathResult, setPathResult] = useState<Entity[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const { data: graphData } = useQuery({
    queryKey: ['graph', worldId],
    queryFn: () => graphApi.get(worldId!),
    enabled: !!worldId,
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', worldId],
    queryFn: () => entitiesApi.list(worldId!),
    enabled: !!worldId,
  });

  const entityOptions = entities.map((e) => ({ value: e.id, label: e.name }));

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    const nodes = graphData.nodes ?? [];
    const edges = graphData.edges ?? [];

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map((n: Entity) => ({
          data: {
            id: n.id,
            label: n.name,
            type: n.entity_type,
            color: ENTITY_TYPE_COLORS[n.entity_type] ?? '#64748B',
            entity: n,
          },
        })),
        ...edges.map((e: Edge) => ({
          data: {
            id: e.id,
            source: e.from_entity_id,
            target: e.to_entity_id,
            label: e.label,
            edge: e,
          },
        })),
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            label: 'data(label)',
            'font-size': '11px',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 4,
            'color': '#334155',
            width: 40,
            height: 40,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#2563EB',
          },
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#94A3B8',
            'line-color': '#94A3B8',
            label: 'data(label)',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            color: '#64748B',
            width: 1.5,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#2563EB',
            'target-arrow-color': '#2563EB',
            'width': 2.5,
          },
        },
      ],
      layout: { name: 'cose', animate: false } as cytoscape.LayoutOptions,
    });

    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data('entity');
      setSelectedNode(nodeData ?? null);
      setSelectedEdge(null);
    });

    cy.on('tap', 'edge', (evt) => {
      const edgeData = evt.target.data('edge');
      setSelectedEdge(edgeData ?? null);
      setSelectedNode(null);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    cyRef.current = cy;

    return () => { cy.destroy(); cyRef.current = null; };
  }, [graphData]);

  const createEdge = useMutation({
    mutationFn: (data: EdgeCreate) => graphApi.createEdge(worldId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['graph', worldId] });
      toast.success('Зв\'язок додано');
      setEdgeModalOpen(false);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteEdge = useMutation({
    mutationFn: (edgeId: string) => graphApi.deleteEdge(worldId!, edgeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['graph', worldId] });
      toast.success('Зв\'язок видалено');
      setSelectedEdge(null);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const {
    register: regEdge,
    handleSubmit: handleEdgeSubmit,
    reset: resetEdge,
    formState: { errors: edgeErrors, isSubmitting: edgeSubmitting },
  } = useForm<EdgeFormData>({ resolver: zodResolver(edgeSchema) });

  const {
    register: regPath,
    handleSubmit: handlePathSubmit,
    formState: { isSubmitting: pathSubmitting },
  } = useForm<PathFormData>({ resolver: zodResolver(pathSchema) });

  const handleFindPath = async (data: PathFormData) => {
    try {
      const result = await graphApi.path(worldId!, data.from_id, data.to_id);
      setPathResult(result);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleCheckConflicts = async () => {
    try {
      const result = await graphApi.conflicts(worldId!);
      setConflicts(result.conflicts ?? []);
      setConflictsOpen(true);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div className="relative h-full flex flex-col" style={{ minHeight: 'calc(100vh - 8rem)' }}>
      {/* Toolbar overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-1 flex flex-col gap-1">
          <button
            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => cyRef.current?.fit()}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Fit"
          >
            <Maximize size={16} />
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-slate-100 p-1 flex flex-col gap-1">
          <button
            onClick={() => setEdgeModalOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Додати зв'язок"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setPathModalOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Знайти шлях"
          >
            <GitBranch size={16} />
          </button>
          <button
            onClick={handleCheckConflicts}
            className="p-2 hover:bg-slate-100 rounded-lg text-amber-500 transition-colors"
            title="Перевірити конфлікти"
          >
            <AlertTriangle size={16} />
          </button>
        </div>
      </div>

      {/* Cytoscape canvas */}
      <div ref={containerRef} className="flex-1 w-full bg-slate-50 rounded-xl border border-slate-100" />

      {/* Node sidepanel */}
      {selectedNode && (
        <div className="absolute top-3 right-3 z-10 w-64 bg-white rounded-xl shadow-modal border border-slate-100 p-4">
          <div className="flex items-start justify-between mb-3">
            <Badge type="entityType" value={selectedNode.entity_type as EntityType} />
            <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
              <X size={14} />
            </button>
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">{selectedNode.name}</h3>
          {selectedNode.description && (
            <p className="text-xs text-slate-500 mb-3 line-clamp-3">{selectedNode.description}</p>
          )}
          <Link
            to={`/worlds/${worldId}/entities/${selectedNode.id}`}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            Переглянути деталі <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Edge tooltip */}
      {selectedEdge && (
        <div className="absolute top-3 right-3 z-10 w-64 bg-white rounded-xl shadow-modal border border-slate-100 p-4">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Зв'язок</span>
            <button onClick={() => setSelectedEdge(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
              <X size={14} />
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">{selectedEdge.label}</p>
          <p className="text-xs text-slate-400 mb-3">
            {selectedEdge.from_entity_id} → {selectedEdge.to_entity_id}
          </p>
          <Button
            size="sm"
            variant="danger"
            onClick={() => { if (confirm('Видалити зв\'язок?')) deleteEdge.mutate(selectedEdge.id); }}
          >
            <X size={12} /> Видалити
          </Button>
        </div>
      )}

      {/* Add Edge Modal */}
      <Modal
        isOpen={edgeModalOpen}
        onClose={() => { setEdgeModalOpen(false); resetEdge(); }}
        title="Додати зв'язок"
      >
        <form
          onSubmit={handleEdgeSubmit((data) => createEdge.mutateAsync(data))}
          className="space-y-4"
        >
          <Select
            label="Від entity"
            options={[{ value: '', label: 'Оберіть...' }, ...entityOptions]}
            error={edgeErrors.from_entity_id?.message}
            {...regEdge('from_entity_id')}
          />
          <Select
            label="До entity"
            options={[{ value: '', label: 'Оберіть...' }, ...entityOptions]}
            error={edgeErrors.to_entity_id?.message}
            {...regEdge('to_entity_id')}
          />
          <div className="flex flex-col gap-1">
            <label className="block text-sm font-medium text-slate-700">Тип зв'язку</label>
            <input
              {...regEdge('label')}
              placeholder="пр. союзник, ворог, батько..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {edgeErrors.label && <p className="text-xs text-red-500">{edgeErrors.label.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setEdgeModalOpen(false); resetEdge(); }}>
              Скасувати
            </Button>
            <Button type="submit" isLoading={edgeSubmitting}>Додати</Button>
          </div>
        </form>
      </Modal>

      {/* Find Path Modal */}
      <Modal
        isOpen={pathModalOpen}
        onClose={() => { setPathModalOpen(false); setPathResult([]); }}
        title="Знайти шлях"
      >
        <form onSubmit={handlePathSubmit(handleFindPath)} className="space-y-4">
          <Select
            label="Від entity"
            options={[{ value: '', label: 'Оберіть...' }, ...entityOptions]}
            {...regPath('from_id')}
          />
          <Select
            label="До entity"
            options={[{ value: '', label: 'Оберіть...' }, ...entityOptions]}
            {...regPath('to_id')}
          />
          <Button type="submit" className="w-full justify-center" isLoading={pathSubmitting}>
            Знайти
          </Button>
        </form>
        {pathResult.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Шлях:</h4>
            <div className="flex flex-wrap items-center gap-1">
              {pathResult.map((e, i) => (
                <span key={e.id} className="flex items-center gap-1">
                  <span className="text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded">{e.name}</span>
                  {i < pathResult.length - 1 && <ArrowRight size={12} className="text-slate-400" />}
                </span>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Conflicts panel */}
      <Modal
        isOpen={conflictsOpen}
        onClose={() => setConflictsOpen(false)}
        title="Конфлікти у графі"
      >
        {conflicts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Конфліктів не знайдено ✓</p>
        ) : (
          <ul className="space-y-2">
            {conflicts.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-lg">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-600" />
                {c}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
