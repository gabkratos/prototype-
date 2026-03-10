import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Layout } from '../layout/Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { fetchAPI } from '../../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Trophy, Mail, Phone, ExternalLink, Medal } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../../hooks/useAuth';

export function CandidateList() {
  useAuth(); // Add authentication check
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidates();
  }, [jobId]);

  const loadCandidates = async () => {
    try {
      const data = await fetchAPI(`/jobs/${jobId}/candidates`);
      setJob(data.job);
      setCandidates(data.candidates);
    } catch (error: any) {
      console.error('Error loading candidates:', error);
      toast.error('Erro ao carregar candidatos');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-600';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-400';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Medal className={`h-5 w-5 ${getRankColor(rank)}`} />;
    return <span className="text-gray-400">#{rank}</span>;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const copyTestLink = () => {
    const link = `${window.location.origin}/test/${job.testId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Candidatos</h1>
            {job && (
              <p className="text-gray-600 mt-1">
                Vaga: {job.title}
              </p>
            )}
          </div>
          {job?.testId && (
            <Button onClick={copyTestLink} variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Copiar Link do Teste
            </Button>
          )}
        </div>

        {/* Stats */}
        {job && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{candidates.length}</div>
                <p className="text-sm text-gray-600">Total de Candidatos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {candidates.filter(c => c.score >= 80).length}
                </div>
                <p className="text-sm text-gray-600">Nota ≥ 80%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {candidates.length > 0
                    ? Math.round(candidates.reduce((sum, c) => sum + c.scorePercentage, 0) / candidates.length)
                    : 0}%
                </div>
                <p className="text-sm text-gray-600">Média Geral</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{job.totalPoints || 0}</div>
                <p className="text-sm text-gray-600">Pontos Totais</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Ranking de Candidatos
            </CardTitle>
            <CardDescription>
              Candidatos ordenados por pontuação obtida no teste técnico
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-gray-500">Carregando candidatos...</p>
            ) : candidates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Nenhum candidato realizou o teste ainda</p>
                {job?.testId && (
                  <Button onClick={copyTestLink} variant="outline">
                    Compartilhar Link do Teste
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rank</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Pontuação</TableHead>
                      <TableHead className="text-center">Percentual</TableHead>
                      <TableHead className="text-center">Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate, index) => (
                      <TableRow
                        key={candidate.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getRankIcon(index + 1)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{candidate.name}</TableCell>
                        <TableCell className="text-gray-600">{candidate.email}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">
                            {candidate.score} / {candidate.totalPoints}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getScoreColor(candidate.scorePercentage)}>
                            {candidate.scorePercentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-600">
                          {new Date(candidate.submittedAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidate(candidate);
                            }}
                          >
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Candidate Details Dialog */}
      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalhes do Candidato</DialogTitle>
            <DialogDescription>
              Análise completa do desempenho no teste técnico
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="answers">Respostas</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Nome:</span>
                      <span>{selectedCandidate.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a href={`mailto:${selectedCandidate.email}`} className="text-blue-600 hover:underline">
                        {selectedCandidate.email}
                      </a>
                    </div>
                    {selectedCandidate.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedCandidate.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Desempenho</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">
                          {selectedCandidate.scorePercentage}%
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Aproveitamento</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">
                          {selectedCandidate.score}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          de {selectedCandidate.totalPoints} pontos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-semibold">Posição no Ranking:</span>
                      <div className="flex items-center gap-2">
                        {getRankIcon(candidates.findIndex(c => c.id === selectedCandidate.id) + 1)}
                        <span className="font-bold">
                          {candidates.findIndex(c => c.id === selectedCandidate.id) + 1}º lugar
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="answers" className="space-y-4">
                {selectedCandidate.answers?.map((answer: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          Questão {index + 1}: {answer.question}
                        </CardTitle>
                        <Badge variant={answer.correct ? 'default' : 'destructive'}>
                          {answer.correct ? `✓ ${answer.points} pts` : '✗ 0 pts'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="text-sm font-semibold">Resposta do candidato:</span>
                        <p className="mt-1 p-3 bg-gray-50 rounded border">
                          {answer.type === 'multiple-choice'
                            ? answer.selectedOption
                            : answer.answer}
                        </p>
                      </div>
                      {!answer.correct && answer.correctAnswer && (
                        <div>
                          <span className="text-sm font-semibold text-green-600">Resposta correta:</span>
                          <p className="mt-1 p-3 bg-green-50 rounded border border-green-200">
                            {answer.correctAnswer}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}