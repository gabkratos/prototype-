import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Helper function to verify user from access token
async function verifyUser(accessToken: string | undefined) {
  if (!accessToken) {
    return { user: null, error: 'No token provided' };
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    return { user, error };
  } catch (error: any) {
    console.error('Token verification error:', error);
    return { user: null, error: error.message };
  }
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-a773f984/health", (c) => {
  return c.json({ status: "ok" });
});

// ============= AUTH ROUTES =============

// Signup - Create new user
app.post("/make-server-a773f984/signup", async (c) => {
  try {
    const { name, company, email, password } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, company },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      name,
      company,
      email,
      createdAt: new Date().toISOString(),
    });

    return c.json({ success: true, userId: data.user.id });
  } catch (error: any) {
    console.error('Signup error in main login flow:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============= DASHBOARD ROUTES =============

app.get("/make-server-a773f984/dashboard", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all jobs for this user
    const jobs = await kv.getByPrefix(`job:${user.id}:`);
    const activeJobs = jobs.filter((job: any) => job.status === 'active');

    // Get all candidates across all jobs
    const candidatesArrays = await Promise.all(
      jobs.map((job: any) => kv.getByPrefix(`candidate:${job.id}:`))
    );
    const allCandidates = candidatesArrays.flat();

    // Get tests count
    const testsCount = jobs.filter((job: any) => job.questions && job.questions.length > 0).length;

    // Get recent jobs (last 5)
    const recentJobs = jobs
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((job: any) => ({
        ...job,
        candidateCount: allCandidates.filter((c: any) => c.jobId === job.id).length,
      }));

    return c.json({
      stats: {
        totalJobs: jobs.length,
        activeJobs: activeJobs.length,
        totalCandidates: allCandidates.length,
        totalTests: testsCount,
      },
      recentJobs,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============= JOB ROUTES =============

// Get all jobs
app.get("/make-server-a773f984/jobs", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobs = await kv.getByPrefix(`job:${user.id}:`);
    
    // Add candidate count and test status for each job
    const jobsWithDetails = await Promise.all(
      jobs.map(async (job: any) => {
        const candidates = await kv.getByPrefix(`candidate:${job.id}:`);
        return {
          ...job,
          candidateCount: candidates.length,
          hasTest: job.questions && job.questions.length > 0,
        };
      })
    );

    return c.json(jobsWithDetails);
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get single job
app.get("/make-server-a773f984/jobs/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobId = c.req.param('id');
    const job = await kv.get(`job:${user.id}:${jobId}`);

    if (!job) {
      return c.json({ error: 'Job not found' }, 404);
    }

    return c.json(job);
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create job
app.post("/make-server-a773f984/jobs", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobData = await c.req.json();
    const jobId = crypto.randomUUID();
    const testId = crypto.randomUUID();

    const job = {
      id: jobId,
      testId,
      userId: user.id,
      ...jobData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`job:${user.id}:${jobId}`, job);

    return c.json(job);
  } catch (error: any) {
    console.error('Error creating job:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Update job
app.put("/make-server-a773f984/jobs/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobId = c.req.param('id');
    const jobData = await c.req.json();

    const existingJob = await kv.get(`job:${user.id}:${jobId}`);
    if (!existingJob) {
      return c.json({ error: 'Job not found' }, 404);
    }

    const updatedJob = {
      ...existingJob,
      ...jobData,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`job:${user.id}:${jobId}`, updatedJob);

    return c.json(updatedJob);
  } catch (error: any) {
    console.error('Error updating job:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete job
app.delete("/make-server-a773f984/jobs/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobId = c.req.param('id');
    
    // Delete job
    await kv.del(`job:${user.id}:${jobId}`);
    
    // Delete all candidates for this job
    const candidates = await kv.getByPrefix(`candidate:${jobId}:`);
    await Promise.all(
      candidates.map((c: any) => kv.del(`candidate:${jobId}:${c.id}`))
    );

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============= TEST ROUTES =============

// Save/Update test for job
app.post("/make-server-a773f984/jobs/:id/test", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobId = c.req.param('id');
    const { testName, duration, questions } = await c.req.json();

    const job = await kv.get(`job:${user.id}:${jobId}`);
    if (!job) {
      return c.json({ error: 'Job not found' }, 404);
    }

    const totalPoints = questions.reduce((sum: number, q: any) => sum + q.points, 0);

    const updatedJob = {
      ...job,
      testName,
      testDuration: duration,
      questions,
      totalPoints,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`job:${user.id}:${jobId}`, updatedJob);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error saving test:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get test by testId (public - for candidates)
app.get("/make-server-a773f984/test/:testId", async (c) => {
  try {
    const testId = c.req.param('testId');
    
    // Find job with this testId
    const allJobs = await kv.getByPrefix('job:');
    const job = allJobs.find((j: any) => j.testId === testId);

    if (!job || !job.questions) {
      return c.json({ error: 'Test not found' }, 404);
    }

    // Return test data without correct answers
    return c.json({
      testName: job.testName,
      duration: job.testDuration || 60,
      questions: job.questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        points: q.points,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching test:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Submit test (public - for candidates)
app.post("/make-server-a773f984/test/:testId/submit", async (c) => {
  try {
    const testId = c.req.param('testId');
    const { candidate, answers } = await c.req.json();

    // Find job with this testId
    const allJobs = await kv.getByPrefix('job:');
    const job = allJobs.find((j: any) => j.testId === testId);

    if (!job || !job.questions) {
      return c.json({ error: 'Test not found' }, 404);
    }

    // Calculate score
    let score = 0;
    const gradedAnswers = job.questions.map((question: any) => {
      const candidateAnswer = answers[question.id];
      let correct = false;

      if (question.type === 'multiple-choice') {
        correct = candidateAnswer === question.correctAnswer;
      }
      // For text and code questions, we'll need manual grading
      // For now, we'll mark them as needing review

      if (correct) {
        score += question.points;
      }

      return {
        question: question.question,
        type: question.type,
        answer: candidateAnswer,
        selectedOption: question.type === 'multiple-choice' && question.options 
          ? question.options[candidateAnswer] 
          : null,
        correctAnswer: question.type === 'multiple-choice' && question.options
          ? question.options[question.correctAnswer]
          : question.correctAnswer,
        correct,
        points: question.points,
      };
    });

    const candidateId = crypto.randomUUID();
    const scorePercentage = Math.round((score / job.totalPoints) * 100);

    const candidateData = {
      id: candidateId,
      jobId: job.id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone || '',
      score,
      scorePercentage,
      totalPoints: job.totalPoints,
      answers: gradedAnswers,
      submittedAt: new Date().toISOString(),
    };

    await kv.set(`candidate:${job.id}:${candidateId}`, candidateData);

    return c.json({ success: true, score, totalPoints: job.totalPoints });
  } catch (error: any) {
    console.error('Error submitting test:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============= CANDIDATE ROUTES =============

// Get candidates for a job
app.get("/make-server-a773f984/jobs/:id/candidates", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobId = c.req.param('id');
    
    const job = await kv.get(`job:${user.id}:${jobId}`);
    if (!job) {
      return c.json({ error: 'Job not found' }, 404);
    }

    const candidates = await kv.getByPrefix(`candidate:${jobId}:`);
    
    // Sort by score descending
    const sortedCandidates = candidates.sort((a: any, b: any) => b.score - a.score);

    return c.json({
      job: {
        id: job.id,
        title: job.title,
        testId: job.testId,
        totalPoints: job.totalPoints,
      },
      candidates: sortedCandidates,
    });
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============= REPORTS ROUTES =============

app.get("/make-server-a773f984/reports", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await verifyUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jobs = await kv.getByPrefix(`job:${user.id}:`);
    
    // Get all candidates across all jobs
    const candidatesArrays = await Promise.all(
      jobs.map((job: any) => kv.getByPrefix(`candidate:${job.id}:`))
    );
    const allCandidates = candidatesArrays.flat();

    // Overview stats
    const totalCandidates = allCandidates.length;
    const averageScore = totalCandidates > 0
      ? Math.round(allCandidates.reduce((sum: number, c: any) => sum + c.scorePercentage, 0) / totalCandidates)
      : 0;
    const topPerformers = allCandidates.filter((c: any) => c.scorePercentage >= 80).length;

    // Job performance data
    const jobPerformance = await Promise.all(
      jobs.map(async (job: any) => {
        const candidates = await kv.getByPrefix(`candidate:${job.id}:`);
        const avgScore = candidates.length > 0
          ? Math.round(candidates.reduce((sum: number, c: any) => sum + c.scorePercentage, 0) / candidates.length)
          : 0;
        
        return {
          jobTitle: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
          averageScore: avgScore,
          candidateCount: candidates.length,
        };
      })
    );

    // Score distribution
    const scoreRanges = [
      { name: '0-20%', min: 0, max: 20, value: 0 },
      { name: '21-40%', min: 21, max: 40, value: 0 },
      { name: '41-60%', min: 41, max: 60, value: 0 },
      { name: '61-80%', min: 61, max: 80, value: 0 },
      { name: '81-100%', min: 81, max: 100, value: 0 },
    ];

    allCandidates.forEach((c: any) => {
      const range = scoreRanges.find(r => c.scorePercentage >= r.min && c.scorePercentage <= r.max);
      if (range) range.value++;
    });

    // Trends over time (group by date)
    const trendMap = new Map();
    allCandidates.forEach((c: any) => {
      const date = new Date(c.submittedAt).toLocaleDateString('pt-BR');
      if (!trendMap.has(date)) {
        trendMap.set(date, { date, candidates: 0, totalScore: 0 });
      }
      const trend = trendMap.get(date);
      trend.candidates++;
      trend.totalScore += c.scorePercentage;
    });

    const trendsOverTime = Array.from(trendMap.values())
      .map(t => ({
        date: t.date,
        candidates: t.candidates,
        averageScore: Math.round(t.totalScore / t.candidates),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return c.json({
      overview: {
        totalJobs: jobs.length,
        totalCandidates,
        averageScore,
        topPerformers,
      },
      jobPerformance: jobPerformance.filter(jp => jp.candidateCount > 0),
      scoreDistribution: scoreRanges.filter(r => r.value > 0),
      trendsOverTime,
    });
  } catch (error: any) {
    console.error('Error generating reports:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);