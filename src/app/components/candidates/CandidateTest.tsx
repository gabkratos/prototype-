import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Progress } from '../ui/progress';
import { fetchAPI } from '../../lib/supabase';
import { toast } from 'sonner';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { publicAnonKey } from '/utils/supabase/info';

export function CandidateTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<'info' | 'test' | 'submitted'>('info');
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [testData, setTestData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 'test' && testData) {
      setTimeRemaining(testData.duration * 60);
    }
  }, [step, testData]);

  useEffect(() => {
    if (step === 'test' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeRemaining]);

  const loadTest = async () => {
    try {
      const data = await fetch(`${fetchAPI.toString().replace('/make-server-a773f984', '')}/functions/v1/make-server-a773f984/test/${testId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }).then(res => res.json());
      setTestData(data);
    } catch (error: any) {
      toast.error('Erro ao carregar teste');
    }
  };

  const startTest = async () => {
    if (!candidateInfo.name || !candidateInfo.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    await loadTest();
    setStep('test');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch(`${fetchAPI.toString().replace('/make-server-a773f984', '')}/functions/v1/make-server-a773f984/test/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate: candidateInfo,
          answers,
        }),
      });
      
      setStep('submitted');
      toast.success('Teste enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar teste');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'info') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Bem-vindo ao Teste Técnico</CardTitle>
            <CardDescription>
              Antes de começar, precisamos de algumas informações suas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={candidateInfo.name}
                  onChange={(e) => setCandidateInfo({ ...candidateInfo, name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={candidateInfo.email}
                  onChange={(e) => setCandidateInfo({ ...candidateInfo, email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={candidateInfo.phone}
                  onChange={(e) => setCandidateInfo({ ...candidateInfo, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Instruções Importantes
              </h3>
              <ul className="text-sm space-y-1 text-gray-700 ml-7">
                <li>• O teste tem duração limitada</li>
                <li>• Você não poderá pausar o teste após iniciado</li>
                <li>• Responda todas as questões com atenção</li>
                <li>• Ao finalizar ou quando o tempo acabar, o teste será enviado automaticamente</li>
              </ul>
            </div>

            <Button onClick={startTest} className="w-full" size="lg">
              Iniciar Teste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-12 pb-8 space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Teste Enviado com Sucesso!</h2>
              <p className="text-gray-600">
                Obrigado por completar o teste. Entraremos em contato em breve com o resultado.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Você pode fechar esta página agora.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando teste...</p>
      </div>
    );
  }

  const question = testData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / testData.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold">{testData.testName}</h1>
                <p className="text-gray-600">
                  Questão {currentQuestion + 1} de {testData.questions.length}
                </p>
              </div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="h-5 w-5" />
                <span className={timeRemaining < 300 ? 'text-red-600' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">
                {question.question}
              </CardTitle>
              <div className="text-sm font-semibold text-blue-600">
                {question.points} pontos
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.type === 'multiple-choice' && (
              <RadioGroup
                value={answers[question.id]?.toString()}
                onValueChange={(value) => setAnswers({ ...answers, [question.id]: parseInt(value) })}
              >
                {question.options?.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === 'text' && (
              <Textarea
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                placeholder="Digite sua resposta aqui..."
                rows={6}
              />
            )}

            {question.type === 'code' && (
              <Textarea
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                placeholder="Digite seu código aqui..."
                rows={12}
                className="font-mono text-sm"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Anterior
          </Button>
          {currentQuestion < testData.questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
              Próxima
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Enviando...' : 'Finalizar Teste'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
