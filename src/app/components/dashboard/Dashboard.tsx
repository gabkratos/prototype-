import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { fetchAPI } from '../../lib/supabase';
import { Plus, Briefcase, Users, TrendingUp, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

interface Stats {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  averageScore: number;
}

export function Dashboard() {
  const { isChecking } = useAuth(); // Add authentication check
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    averageScore: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isChecking) {
      loadDashboard();
    }
  }, [isChecking]);

  const loadDashboard = async () => {
    try {
      const data = await fetchAPI('/dashboard');
      setStats(data.stats);
      setRecentJobs(data.recentJobs);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total de Vagas',
      value: stats.totalJobs,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Vagas Ativas',
      value: stats.activeJobs,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Candidatos',
      value: stats.totalCandidates,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Média de Pontuação',
      value: stats.averageScore,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo à plataforma de recrutamento técnico
            </p>
          </div>
          <Button onClick={() => navigate('/jobs/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Vaga
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Vagas Recentes</CardTitle>
            <CardDescription>Gerencie suas vagas e processos seletivos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-center py-8">Carregando...</p>
            ) : recentJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhuma vaga cadastrada ainda</p>
                <Button onClick={() => navigate('/jobs/new')}>
                  Criar Primeira Vaga
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/jobs/${job.id}/candidates`)}
                  >
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.department}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{job.candidateCount || 0} candidatos</p>
                        <p className="text-xs text-gray-500">
                          {job.status === 'active' ? 'Ativa' : 'Inativa'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}