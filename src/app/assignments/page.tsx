"use client";
import { useAssignments } from '@/hooks/useAssignments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function AssignmentsPage() {
  const { assignments, submissions, submit, evaluate } = useAssignments();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');

  const handleEvaluate = (subId: string) => {
    evaluate({ id: subId, scores, feedback });
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Assignments</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Student Portal</h2>
          {assignments.map(asg => (
            <Card key={asg.id} className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-bold">{asg.title}</h3>
                <p className="text-sm text-slate-500 mb-4">Due: {new Date(asg.dueDate).toLocaleString()}</p>
                <Button onClick={() => submit({ assignmentId: asg.id, studentId: 'me', fileUrl: 'http://example.com/file.pdf' })}>
                  Submit Homework (Simulate Late)
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Evaluator Workspace</h2>
          {submissions.map(sub => (
            <Card key={sub.id} className="mb-4 bg-white shadow-soft">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold">Student: {sub.studentId}</span>
                  <Badge variant={sub.status === 'LATE' ? 'destructive' : 'default'}>{sub.status}</Badge>
                </div>
                {sub.status !== 'EVALUATED' ? (
                  <div className="space-y-4">
                    <p className="text-sm">Rubric Scoring:</p>
                    <div className="flex gap-4">
                      <input type="number" placeholder="Content /50" className="border p-1 w-24" onChange={e => setScores({ ...scores, content: Number(e.target.value) })} />
                      <input type="number" placeholder="Working /30" className="border p-1 w-24" onChange={e => setScores({ ...scores, working: Number(e.target.value) })} />
                      <input type="number" placeholder="Clarity /20" className="border p-1 w-24" onChange={e => setScores({ ...scores, clarity: Number(e.target.value) })} />
                    </div>
                    <textarea placeholder="Feedback" className="border p-2 w-full" onChange={e => setFeedback(e.target.value)}></textarea>
                    <Button onClick={() => handleEvaluate(sub.id)}>Publish Grade</Button>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-green-600">Score: {sub.totalScore}</p>
                    <p className="text-sm text-slate-600 mt-2">Feedback: {sub.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
