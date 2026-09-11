/**
 * 史戰風雲 —— 靈感來自回合制卡牌對戰（如三國殺的體力／出牌節奏）
 * 原創中史科教學玩法，並非三國殺複製品，不含官方牌面／技能原文
 */
import { QUESTIONS, checkFill } from "./questions.js?v=rps1";
import { CHARACTERS } from "./characters.js?v=rps1";

export const SHIZHAN_MAX_HP = 4;

export const CARD_TYPES = {
  attack: {
    id: "attack",
    name: "問攻",
    icon: "⚔️",
    color: "#9b2226",
    desc: "答對選擇題 → 對敵造成 1 點傷害",
  },
  heal: {
    id: "heal",
    name: "回春",
    icon: "🌿",
    color: "#2d6a4f",
    desc: "答對填充題 → 回復 1 點體力",
  },
  strategy: {
    id: "strategy",
    name: "奇策",
    icon: "📜",
    color: "#6d597a",
    desc: "答對難題 → 對敵造成 2 點傷害",
  },
  defend: {
    id: "defend",
    name: "守禦",
    icon: "🛡️",
    color: "#3d5a80",
    desc: "裝備守勢；下回合敵攻時可答題抵擋",
  },
};

function pickMc(hard = false) {
  const list = QUESTIONS.mc;
  // 難題：中二／中三優先
  const pool = hard
    ? list.filter((q) => q.grade === "中二" || q.grade === "中三")
    : list;
  const src = pool.length ? pool : list;
  return src[Math.floor(Math.random() * src.length)];
}

function pickFill() {
  const list = QUESTIONS.fill;
  return list[Math.floor(Math.random() * list.length)];
}

export function randomEnemy(excludeId) {
  const all = [...CHARACTERS.male, ...CHARACTERS.female].filter((c) => c.id !== excludeId);
  return all[Math.floor(Math.random() * all.length)];
}

export function createHand() {
  const bag = ["attack", "attack", "attack", "heal", "heal", "strategy", "defend", "defend"];
  const hand = [];
  for (let i = 0; i < 4; i++) {
    const t = bag[Math.floor(Math.random() * bag.length)];
    hand.push({ uid: `c${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`, type: t });
  }
  return hand;
}

export function createBattle(playerChar) {
  const enemy = randomEnemy(playerChar?.id);
  return {
    phase: "player", // player | quiz | enemy | end
    turn: 1,
    playerHp: SHIZHAN_MAX_HP,
    enemyHp: SHIZHAN_MAX_HP,
    enemy,
    hand: createHand(),
    hasGuard: false,
    log: [`⚔️ 史戰開始！你對上「${enemy.name}」`],
    quiz: null, // { cardUid, cardType, question, mode: 'mc'|'fill', purpose: 'play'|'guard' }
    winner: null, // 'player' | 'enemy'
    skillReady: true, // 角色技：本局一次，問攻傷害+1
  };
}

export function hearts(hp, max = SHIZHAN_MAX_HP) {
  return Array.from({ length: max }, (_, i) => (i < hp ? "♥" : "♡")).join("");
}

export function startPlayCard(battle, cardUid) {
  if (battle.phase !== "player" || battle.winner) return battle;
  const card = battle.hand.find((c) => c.uid === cardUid);
  if (!card) return battle;
  const meta = CARD_TYPES[card.type];

  if (card.type === "defend") {
    const hand = battle.hand.filter((c) => c.uid !== cardUid);
    return {
      ...battle,
      hand: hand.length ? hand : createHand(),
      hasGuard: true,
      log: [...battle.log, `🛡️ 你打出【${meta.name}】，進入守勢`],
      phase: "enemy",
    };
  }

  const mode = card.type === "heal" ? "fill" : "mc";
  const question = mode === "fill" ? pickFill() : pickMc(card.type === "strategy");
  return {
    ...battle,
    quiz: {
      cardUid,
      cardType: card.type,
      question,
      mode,
      purpose: "play",
      skillBoost: false,
    },
    phase: "quiz",
    log: [...battle.log, `出牌【${meta.name}】——答題決勝負`],
  };
}

export function useSkillOnQuiz(battle) {
  if (!battle.quiz || !battle.skillReady) return battle;
  if (battle.quiz.cardType !== "attack" && battle.quiz.cardType !== "strategy") return battle;
  return {
    ...battle,
    skillReady: false,
    quiz: { ...battle.quiz, skillBoost: true },
    log: [...battle.log, "✨ 發動角色技：此擊傷害 +1"],
  };
}

function afterPlayerAction(battle, handWithoutCard) {
  const hand = handWithoutCard.length >= 2 ? handWithoutCard : [...handWithoutCard, ...createHand()].slice(0, 4);
  return { ...battle, hand, quiz: null, phase: "enemy" };
}

export function resolvePlayerQuiz(battle, answer) {
  if (battle.phase !== "quiz" || !battle.quiz || battle.quiz.purpose !== "play") return battle;
  const { cardUid, cardType, question, mode, skillBoost } = battle.quiz;
  const meta = CARD_TYPES[cardType];
  let correct = false;
  if (mode === "mc") correct = Number(answer) === question.answer;
  else correct = checkFill(question, answer);

  let { playerHp, enemyHp, log } = battle;
  const hand = battle.hand.filter((c) => c.uid !== cardUid);

  if (!correct) {
    log = [...log, `❌ 答錯了！【${meta.name}】失效。${question.explain || question.answers?.[0] || ""}`];
    return afterPlayerAction({ ...battle, log, playerHp, enemyHp }, hand);
  }

  if (cardType === "heal") {
    playerHp = Math.min(SHIZHAN_MAX_HP, playerHp + 1);
    log = [...log, `✅ 答對！【回春】回復 1 點體力`];
  } else {
    let dmg = cardType === "strategy" ? 2 : 1;
    if (skillBoost) dmg += 1;
    // AI 有機率「擋」——簡化：30% 自動擋掉 1 點
    let blocked = 0;
    if (Math.random() < 0.28) {
      blocked = Math.min(1, dmg);
      dmg -= blocked;
      log = [...log, `🤖 ${battle.enemy.name} 勉強守住 1 點！`];
    }
    enemyHp = Math.max(0, enemyHp - dmg);
    log = [...log, `✅ 答對！【${meta.name}】造成 ${dmg} 點傷害`];
  }

  let next = afterPlayerAction({ ...battle, log, playerHp, enemyHp }, hand);
  if (enemyHp <= 0) {
    return { ...next, phase: "end", winner: "player", enemyHp: 0, log: [...next.log, "🏆 你贏了這場史戰！"] };
  }
  return next;
}

export function resolveEnemyTurn(battle) {
  if (battle.phase !== "enemy" || battle.winner) return battle;
  // 敵方發動問攻：你需要答題守禦，或若已有守勢則較易
  const question = pickMc(false);
  return {
    ...battle,
    phase: "quiz",
    quiz: {
      cardUid: null,
      cardType: "defend",
      question,
      mode: "mc",
      purpose: "guard",
      skillBoost: false,
    },
    log: [...battle.log, `🔥 ${battle.enemy.name} 打出【問攻】！快答題守禦`],
  };
}

export function resolveGuardQuiz(battle, answer) {
  if (battle.phase !== "quiz" || !battle.quiz || battle.quiz.purpose !== "guard") return battle;
  const { question } = battle.quiz;
  const correct = Number(answer) === question.answer;
  let { playerHp, hasGuard, log, turn } = battle;

  if (correct || hasGuard) {
    if (correct && hasGuard) log = [...log, "✅ 守勢加持，完美擋下攻擊！"];
    else if (correct) log = [...log, "✅ 答對守禦，化解攻擊！"];
    else log = [...log, "🛡️ 守勢生效，擋下一擊（下次需重新出【守禦】）"];
    hasGuard = false;
  } else {
    playerHp = Math.max(0, playerHp - 1);
    log = [...log, `💥 守禦失敗，你失去 1 點體力。正解：${question.options[question.answer]}`];
  }

  if (playerHp <= 0) {
    return {
      ...battle,
      playerHp: 0,
      hasGuard: false,
      quiz: null,
      phase: "end",
      winner: "enemy",
      log: [...log, "💀 體力歸零，史戰敗北……再試一次！"],
    };
  }

  return {
    ...battle,
    playerHp,
    hasGuard,
    quiz: null,
    phase: "player",
    turn: turn + 1,
    log: [...log, `—— 第 ${turn + 1} 回合 ——`],
  };
}

export const SHIZHAN_XP = {
  win: 28,
  lose: 8,
  perDamage: 2,
};
