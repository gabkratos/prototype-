import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Layout } from '../layout/Layout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { fetchAPI } from '../../lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';

interface Question {
  id: string;
  type: 'multiple-choice' | 'text' | 'code';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
}

export function TestBuilder() {
  useAuth(); // Add authentication check
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState<any>(null);
  const [testName, setTestName] = useState('');
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTestData();
  }, [jobId]);

  const loadTestData = async () => {
    try {
      const jobData = await fetchAPI(`/jobs/${jobId}`);
      setJob(jobData);
      setTestName(jobData.testName || `Teste - ${jobData.title}`);
      setDuration(jobData.testDuration || 60);

      if (jobData.questions && jobData.questions.length > 0) {
        setQuestions(jobData.questions);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
      navigate('/jobs');
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    if (!testName.trim()) {
      toast.error('Digite um nome para o teste');
      return;
    }

    if (questions.length === 0) {
      toast.error('Adicione pelo menos uma questão');
      return;
    }

    setLoading(true);
    try {
      await fetchAPI(`/jobs/${jobId}/test`, {
        method: 'POST',
        body: JSON.stringify({
          testName,
          duration,
          questions,
        }),
      });
      toast.success('Teste salvo com sucesso!');
      navigate('/jobs');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar teste');
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Construtor de Testes</h1>
            {job && (
              <p className="text-gray-600 mt-1">
                Vaga: {job.title}
              </p>
            )}
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Teste'}
          </Button>
        </div>

        {/* Test Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testName">Nome do Teste</Label>
                <Input
                  id="testName"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Ex: Avaliação Técnica JavaScript"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min="5"
                  max="240"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">
                {questions.length} questões
              </Badge>
              <Badge variant="secondary">
                {totalPoints} pontos totais
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Questões</h2>
            <Button onClick={addQuestion} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Questão
            </Button>
          </div>

          {questions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600 mb-4">Nenhuma questão adicionada ainda</p>
                <Button onClick={addQuestion}>Adicionar Primeira Questão</Button>
              </CardContent>
            </Card>
          ) : (
            questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <CardTitle className="text-lg">Questão {index + 1}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Tipo de Questão</Label>
                      <Select
                        value={question.type}
                        onValueChange={(value: any) => updateQuestion(question.id, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple-choice">Múltipla Escolha</SelectItem>
                          <SelectItem value="text">Resposta Aberta</SelectItem>
                          <SelectItem value="code">Código</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pontos</Label>
                      <Input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(question.id, { points: Number(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Pergunta</Label>
                    <Textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                      placeholder="Digite a pergunta aqui..."
                      rows={3}
                    />
                  </div>

                  {question.type === 'multiple-choice' && (
                    <div className="space-y-3">
                      <Label>Opções de Resposta</Label>
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correctAnswer === optIndex}
                            onChange={() => updateQuestion(question.id, { correctAnswer: optIndex })}
                            className="h-4 w-4"
                          />
                          <Input
                            value={option}
                            onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                            placeholder={`Opção ${optIndex + 1}`}
                          />
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">
                        Selecione a opção correta marcando o círculo
                      </p>
                    </div>
                  )}

                  {question.type === 'text' && (
                    <div className="space-y-2">
                      <Label>Resposta Esperada (para referência)</Label>
                      <Textarea
                        value={question.correctAnswer as string || ''}
                        onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                        placeholder="Digite a resposta esperada..."
                        rows={3}
                      />
                      <p className="text-xs text-gray-500">
                        Esta resposta será usada como referência na correção manual
                      </p>
                    </div>
                  )}

                  {question.type === 'code' && (
                    <div className="space-y-2">
                      <Label>Solução Esperada (para referência)</Label>
                      <Textarea
                        value={question.correctAnswer as string || ''}
                        onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                        placeholder="Digite o código esperado..."
                        rows={5}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Esta solução será usada como referência na correção manual
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}