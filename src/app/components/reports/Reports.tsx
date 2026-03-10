import { useState, useEffect } from 'react';
import { Layout } from '../layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { fetchAPI } from '../../lib/supabase';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Briefcase, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../../hooks/useAuth';

export function Reports() {
  const { isChecking } = useAuth(); // Add authentication check
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>({
    overview: {
      totalJobs: 0,
      totalCandidates: 0,
      averageScore: 0,
      topPerformers: 0,
    },
    jobPerformance: [],
    scoreDistribution: [],
    trendsOverTime: [],
  });

  useEffect(() => {
    if (!isChecking) {
      loadReports();
    }
  }, [isChecking]);

  const loadReports = async () => {
    try {
      const data = await fetchAPI('/reports');
      setReportData(data);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const statCards = [
    {
      title: 'Total de Vagas',
      value: reportData.overview.totalJobs,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total de Candidatos',
      value: reportData.overview.totalCandidates,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Média de Aproveitamento',
      value: `${reportData.overview.averageScore}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Candidatos Destaque',
      value: reportData.overview.topPerformers,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: '≥ 80%',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Indicadores</h1>
          <p className="text-gray-600 mt-1">
            Análise detalhada dos processos seletivos e desempenho dos candidatos
          </p>
        </div>

        {/* Overview Stats */}
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
                  {stat.description && (
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="performance">Desempenho por Vaga</TabsTrigger>
            <TabsTrigger value="distribution">Distribuição de Notas</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Desempenho Médio por Vaga</CardTitle>
                <CardDescription>
                  Comparativo de pontuação média dos candidatos em cada vaga
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Carregando dados...</p>
                ) : reportData.jobPerformance.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Nenhum dado disponível ainda
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.jobPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jobTitle" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="averageScore" fill="#3b82f6" name="Média (%)" />
                      <Bar dataKey="candidateCount" fill="#10b981" name="Candidatos" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Notas</CardTitle>
                <CardDescription>
                  Percentual de candidatos por faixa de pontuação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Carregando dados...</p>
                ) : reportData.scoreDistribution.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Nenhum dado disponível ainda
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={reportData.scoreDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reportData.scoreDistribution.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col justify-center space-y-4">
                      {reportData.scoreDistribution.map((item: any, index: number) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="text-gray-600">{item.value} candidatos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendências ao Longo do Tempo</CardTitle>
                <CardDescription>
                  Evolução do número de candidatos e aproveitamento médio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Carregando dados...</p>
                ) : reportData.trendsOverTime.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Nenhum dado disponível ainda
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={reportData.trendsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="candidates"
                        stroke="#3b82f6"
                        name="Candidatos"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="averageScore"
                        stroke="#10b981"
                        name="Média (%)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}