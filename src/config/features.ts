export const features = {
  NEXT_PUBLIC_FEATURE_QUIZZES: process.env.NEXT_PUBLIC_FEATURE_QUIZZES === 'true',
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === 'true',
};