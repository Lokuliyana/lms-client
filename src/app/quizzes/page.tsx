"use client";
import { useQuizzes } from '@/hooks/useQuizzes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function QuizzesPage() {
  const { quiz, stats, challenge } = useQuizzes();
  const [fiftyFifty, setFiftyFifty] = useState(false);

  const simulateMatch = () => {
    challenge({ p1: 'student-A', p2: 'student-B', s1: 10, s2: 5 });
  };

  if (!quiz) return null;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Quiz Engine & 1v1 Arena</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Single Player: {quiz.title}</h2>
            <div className="mb-4">
              <p className="font-medium mb-2">{quiz.questions[0].text}</p>
              <div className="space-y-2">
                {quiz.questions[0].options.map((opt, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className={`w-full justify-start ${fiftyFifty && i !== 1 && i !== 2 ? 'opacity-0' : ''}`}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={() => setFiftyFifty(true)} variant="secondary">Powerup: 50/50</Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">1v1 Arena ELO Rankings</h2>
            <div className="space-y-2 mb-6">
              {stats.map(s => (
                <div key={s.userId} className="flex justify-between items-center p-3 border rounded bg-slate-50">
                  <span className="font-semibold">{s.userId}</span>
                  <span className="text-blue-600 font-bold">ELO {s.elo}</span>
                </div>
              ))}
            </div>
            <Button onClick={simulateMatch} className="w-full">Simulate Match (A wins vs B)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
