import { ROOMS } from './rooms'

const sum = (s, k) => ROOMS.reduce((a, r) => a + s.rooms[r.id][k], 0)

// test(state, event) runs after every round or quiz. event: { win, bad, diff, daily, quiz: {correct,total} }
export const ACHIEVEMENTS = [
  { id: 'first', name: 'First Blood', desc: 'Win any round', test: (s) => sum(s, 'wins') >= 1 },
  { id: 'flawless', name: 'Flawless', desc: 'Win a round with zero mistakes', test: (s, e) => !!e.win && e.bad === 0 },
  { id: 'crawler', name: 'Dungeon Crawler', desc: 'Win at least once in every room', test: (s) => ROOMS.every((r) => s.rooms[r.id].wins >= 1) },
  { id: 'perfect', name: 'Perfectionist', desc: 'Hold 3 stars in every room', test: (s) => ROOMS.every((r) => s.rooms[r.id].stars === 3) },
  { id: 'veteran', name: 'Veteran', desc: 'Win 25 rounds', test: (s) => sum(s, 'wins') >= 25 },
  { id: 'sharp', name: 'Sharp Mind', desc: 'Make 100 correct moves in total', test: (s) => sum(s, 'ok') >= 100 },
  { id: 'knight', name: 'Knighted', desc: 'Reach 150 XP', test: (s) => s.xp >= 150 },
  { id: 'master', name: 'Dungeon Master', desc: 'Reach 500 XP', test: (s) => s.xp >= 500 },
  { id: 'hard', name: 'Hard Mode Hero', desc: 'Win a round on Hard', test: (s, e) => !!e.win && e.diff === 'hard' },
  { id: 'streak3', name: 'On a Roll', desc: 'Clear the daily challenge 3 days in a row', test: (s) => s.streak.count >= 3 },
  { id: 'streak7', name: 'Week of Fire', desc: 'Clear the daily challenge 7 days in a row', test: (s) => s.streak.count >= 7 },
  { id: 'quizwhiz', name: 'Quiz Whiz', desc: 'Answer every question right in a quiz', test: (s, e) => !!e.quiz && e.quiz.total > 0 && e.quiz.correct === e.quiz.total },
  { id: 'scholar', name: 'Scholar', desc: 'Finish 5 quizzes', test: (s) => s.quiz.taken >= 5 },
]
