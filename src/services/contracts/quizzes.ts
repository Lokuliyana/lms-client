export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}
export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}
export interface ChallengeMatch {
  id: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  p1Score: number;
  p2Score: number;
}
export interface UserQuizStats {
  userId: string;
  elo: number;
}
export interface IQuizRepository {
  getQuiz(id: string): Promise<Quiz>;
  submitQuiz(quizId: string, score: number): Promise<void>;
  createChallenge(p1Id: string, p2Id: string, p1Score: number, p2Score: number): Promise<ChallengeMatch>;
  getStats(): Promise<UserQuizStats[]>;
}
