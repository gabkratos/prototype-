import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../layout/Layout';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { fetchAPI } from '../../lib/supabase';
import { Plus, Edit, FileText, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

export function JobList() {
  const { isChecking } = useAuth(); // Add authentication check
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isChecking) {
      loadJobs();
    }
  }, [isChecking]);

  const loadJobs = async () => {
    try {
      const data = await fetchAPI('/jobs');
      setJobs(data);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast.error('Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!jobToDelete) return;

    try {
      await fetchAPI(`/jobs/${jobToDelete}`, { method: 'DELETE' });
      toast.success('Vaga excluída com sucesso');
      setJobs(jobs.filter((job) => job.id !== jobToDelete));
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    } catch (error: any) {
      toast.error('Erro ao excluir vaga');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Vagas</h1>
            <p className="text-gray-600 mt-1">Gerencie todas as vagas e processos seletivos</p>
          </div>
          <Button onClick={() => navigate('/jobs/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Vaga
          </Button>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <p className="text-center py-12 text-gray-500">Carregando vagas...</p>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma vaga cadastrada</h3>
              <p className="text-gray-600 mb-4">Comece criando sua primeira vaga</p>
              <Button onClick={() => navigate('/jobs/new')}>Criar Vaga</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg">{job.title}</h3>
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                          {job.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{job.department}</p>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {job.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{job.candidateCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{job.hasTest ? 'Teste criado' : 'Sem teste'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jobs/${job.id}/edit`)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jobs/${job.id}/test`)}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Teste
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jobs/${job.id}/candidates`)}
                        className="gap-2 col-span-2"
                      >
                        <Users className="h-4 w-4" />
                        Ver Candidatos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeleteDialogOpen(true);
                          setJobToDelete(job.id);
                        }}
                        className="gap-2 col-span-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir Vaga
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta vaga? Esta ação não pode ser desfeita e
              todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}