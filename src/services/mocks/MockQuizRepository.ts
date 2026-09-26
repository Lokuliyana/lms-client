import { IQuizRepository, Quiz, ChallengeMatch, UserQuizStats } from '../contracts/quizzes';

let mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Calculus Speed Run',
  questions: [
    { id: 'q1', text: 'd/dx (x^2) = ?', options: ['x', '2x', 'x^2', '2'], correctIndex: 1 }
  ]
};

let stats: UserQuizStats[] = [
  { userId: 'student-A', elo: 1200 },
  { userId: 'student-B', elo: 1200 }
];

let challenges: ChallengeMatch[] = [];

export class MockQuizRepository implements IQuizRepository {
  async getQuiz(id: string) { return mockQuiz; }
  async submitQuiz() {}
  async createChallenge(p1Id: string, p2Id: string, p1Score: number, p2Score: number) {
    const match: ChallengeMatch = {
      id: 'match-' + Date.now(), player1Id: p1Id, player2Id: p2Id, 
      p1Score, p2Score, winnerId: p1Score > p2Score ? p1Id : p2Id
    };
    challenges.push(match);

    // ELO update logic
    const s1 = stats.find(s => s.userId === p1Id);
    const s2 = stats.find(s => s.userId === p2Id);
    if (s1 && s2) {
      const K = 32;
      const r1 = Math.pow(10, s1.elo / 400);
      const r2 = Math.pow(10, s2.elo / 400);
      const e1 = r1 / (r1 + r2);
      const e2 = r2 / (r1 + r2);
      const s1Actual = match.winnerId === p1Id ? 1 : 0;
      const s2Actual = match.winnerId === p2Id ? 1 : 0;
      s1.elo = Math.round(s1.elo + K * (s1Actual - e1));
      s2.elo = Math.round(s2.elo + K * (s2Actual - e2));
    }

    return match;
  }
  async getStats() { return [...stats]; }
}
