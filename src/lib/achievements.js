import { ROOMS } from './rooms'
import { LEVELS, clearedCount } from './campaign'

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
  { id: 'wpm40', name: 'Speed Scribe', desc: 'Finish a Scribe Tower typing round at 40 WPM or more', test: (s) => s.best.wpm >= 40 },
  { id: 'rush', name: 'Rush Master', desc: 'Clear all three rooms of a Boss Rush', test: (s, e) => !!e.rush },
  { id: 'lvl5', name: 'Pathfinder', desc: 'Clear 5 campaign levels', test: (s) => clearedCount(s.campaign.stars) >= 5 },
  { id: 'lvl20', name: 'Campaign Complete', desc: 'Clear every campaign level', test: (s) => clearedCount(s.campaign.stars) >= LEVELS.length },
  { id: 'xp800', name: 'Algorithm Sage', desc: 'Reach 800 XP', test: (s) => s.xp >= 800 },
  { id: 'quest1', name: 'Quest Taker', desc: 'Complete a daily quest', test: (s) => s.questsDone >= 1 },
  { id: 'quest10', name: 'Questmaster', desc: 'Complete 10 daily quests', test: (s) => s.questsDone >= 10 },
  { id: 'prefix', name: 'Prefix Pro', desc: 'Win a round in Trie Tunnel and one in Union Yard', test: (s) => s.rooms.trie.wins >= 1 && s.rooms.union.wins >= 1 },
  { id: 'veteran100', name: 'Centurion', desc: 'Win 100 rounds', test: (s) => sum(s, 'wins') >= 100 },
  { id: 'world5', name: 'Catacomb Delver', desc: 'Clear every level of World 5', test: (s) => [1, 2, 3, 4, 5].every((n) => (s.campaign.stars[`5-${n}`] || 0) >= 1) },
  { id: 'scholar', name: 'Scholar', desc: 'Finish 5 quizzes', test: (s) => s.quiz.taken >= 5 },
]
