'use strict';

// LB data for 5.x+ content
const LBAmounts = {
  // Amount per LB Bar
  barSize: 10000,
  // Frequency of passive generation (in seconds).
  passiveFrequency: 3,
  // Surviving Lethal / Healing Critical (<10%) HP scale
  surviveLethalScale: 100,
  // Passive amounts are based on number of LB bars and comp.
  passiveScales: [{
    // One bar
    scale: [75],
  }, {
    // Two bars
    scale: [180],
  }, {
    // Three bars
    scale: [220, 170, 160, 154, 144, 140],
  }]
};

// Records limit break value history
class LimitBreakHistory {
  constructor() {
    // History
    this.hist = [0];
    // Max Number of LB Bars
    this.bars = 1;
    // Party info
    this.party = {
      jobDuplicates: 0,
      // { id, name, worldId, job, inParty }
      list: []
    };
    // Surviving Lethal or Healing Critical
    // Increases by 2 if the source was a single-target heal
    this.surviveLethalCnt = 0;
    // Passive LB Generation
    this.passiveCnt = 0;
    // Source of LB is unknown
    this.unknownCnt = 0;
  }

  updateHistory(hex, bars) {
    // Get the current total amount of LB
    const currentLB = Number.parseInt(hex, 16);
    if (!currentLB) {
      // Reset history if current value is 0
      this.reset();
      return;
    }

    // Add new value to history
    this.hist.push(currentLB);

    // Update Counters
    this.bars = Number.parseInt(bars, 10);
    this.updateCounters();
  }

  updateCounters() {
    const counters = {
      surviveLethalCnt: 0,
      passiveCnt: 0,
      unknownCnt: 0,
    }

    const lbAmounts = this.getLBAmountsForParty();
    for (let i = 1; i < this.hist.length; i++) {
      const generatedLB = this.hist[i] - this.hist[i - 1];

      // No gain or LB is reset
      if (generatedLB <= 0)
        continue;

      // Passive ticks
      if (generatedLB === lbAmounts.passive) {
        counters.passiveCnt = counters.passiveCnt + 1;
        continue;
      }

      // Surviving Lethal (+2) or Healing <10% HP (+1)
      if (generatedLB % lbAmounts.surviveLethal === 0) {
        counters.surviveLethalCnt = counters.surviveLethalCnt + (generatedLB / lbAmounts.surviveLethal);
        continue;
      }

      // Source is unknown
      // if (this.hist[i] !== this.bars * lbAmounts.barSize) console.log("Unknown Amount", generatedLB, lbAmounts);
      counters.unknownCnt = counters.unknownCnt + 1;
    }

    this.surviveLethalCnt = counters.surviveLethalCnt;
    this.passiveCnt = counters.passiveCnt;
    this.unknownCnt = counters.unknownCnt;
  }

  reset() {
    // Reset history and counts
    this.hist = [0];
    this.surviveLethalCnt = 0;
    this.passiveCnt = 0;
    this.unknownCnt = 0;
  }

  secondsUntilNextBar() {
    // Calculate the number of seconds until the next LB bar.
    const lbAmounts = this.getLBAmountsForParty();
    const currentLB = this.getCurrentValue();
    const amountUntilNextBar = LBAmounts.barSize - (currentLB % LBAmounts.barSize);
    const secondUntilNextBar = (amountUntilNextBar / lbAmounts.passive) * LBAmounts.passiveFrequency;
    return Math.ceil(secondUntilNextBar / 3) * 3;
  }

  secondsUntilMax() {
    // Calculate the number of seconds until the max LB.
    const lbAmounts = this.getLBAmountsForParty();
    const currentLB = this.getCurrentValue();
    const amountUntilMax = (LBAmounts.barSize * this.bars) - currentLB;
    const secondUntilMax = (amountUntilMax / lbAmounts.passive) * LBAmounts.passiveFrequency;
    return Math.ceil(secondUntilMax / 3) * 3;
  }

  toTimeFormat(floatSeconds) {
    if (!this.getCurrentValue())
      return '';

    // Formatted time string #m#s
    const intSeconds = Math.floor(floatSeconds);
    const minutes = Math.floor(intSeconds / 60);
    const seconds = intSeconds % 60;
    let str = '';

    if (minutes > 0)
      str = minutes + 'm';

    str += seconds + 's';
    return str;
  }

  getCurrentValue() {
    return this.hist[this.hist.length - 1];
  }

  getLBAmountsForParty() {
    const bars = Math.min(Math.max(this.bars, 1), LBAmounts.passiveScales.length);
    const scale = LBAmounts.passiveScales[bars - 1].scale;
    return {
      ...LBAmounts,
      surviveLethal: LBAmounts.surviveLethalScale * bars,
      passive: scale[Math.min(this.jobDuplicates, scale.length - 1)]
    };
  }
}

// Gets a map of LB increments for debugging purposes
const debugFromLog = log => {
  const values = log.split('\n').map(line => Number.parseInt(line.substr(line.length - 4), 16));
  const results = { counts: {}, events: {} };

  for (let i = 1; i < values.length; i++) {
    let gain = values[i] - values[i - 1];
    if (gain <= 0)
      continue;
    results.counts[gain] = results.counts[gain] ? results.counts[gain] + 1 : 1;
    if (results.events[gain])
      results.events[gain].push(values[i].toString(16).toUpperCase());
    else
      results.events[gain] = [values[i].toString(16).toUpperCase()];
  }
  return results;
}

// Credit / Taken from: https://github.com/quisquous/cactbot/pull/1794
const kTankJobs = ['GLA', 'PLD', 'MRD', 'WAR', 'DRK', 'GNB'];
const kHealerJobs = ['CNJ', 'WHM', 'SCH', 'AST'];
const kMeleeDpsJobs = ['PGL', 'MNK', 'LNC', 'DRG', 'ROG', 'NIN', 'SAM'];
const kRangedDpsJobs = ['ARC', 'BRD', 'DNC', 'MCH'];
const kCasterDpsJobs = ['BLU', 'RDM', 'BLM', 'SMN', 'ACN', 'THM'];
const kDpsJobs = [...kMeleeDpsJobs, ...kRangedDpsJobs, ...kCasterDpsJobs];
const kCraftingJobs = ['CRP', 'BSM', 'ARM', 'GSM', 'LTW', 'WVR', 'ALC', 'CUL'];
const kGatheringJobs = ['MIN', 'BTN', 'FSH'];
const kAllRoles = ['tank', 'healer', 'dps', 'crafter', 'gatherer', 'none'];

const kJobEnumToName = {
  0: 'NONE',
  1: 'GLA',
  2: 'PGL',
  3: 'MRD',
  4: 'LNC',
  5: 'ARC',
  6: 'CNJ',
  7: 'THM',
  8: 'CRP',
  9: 'BSM',
  10: 'ARM',
  11: 'GSM',
  12: 'LTW',
  13: 'WVR',
  14: 'ALC',
  15: 'CUL',
  16: 'MIN',
  17: 'BTN',
  18: 'FSH',
  19: 'PLD',
  20: 'MNK',
  21: 'WAR',
  22: 'DRG',
  23: 'BRD',
  24: 'WHM',
  25: 'BLM',
  26: 'ACN',
  27: 'SMN',
  28: 'SCH',
  29: 'ROG',
  30: 'NIN',
  31: 'MCH',
  32: 'DRK',
  33: 'AST',
  34: 'SAM',
  35: 'RDM',
  36: 'BLU',
  37: 'GNB',
  38: 'DNC',
};

const jobToRoleMap = (() => {
  const addToMap = (map, keys, value) => keys.forEach((key) => map.set(key, value));

  const map = new Map([['NONE', 'none']]);
  addToMap(map, kTankJobs, 'tank');
  addToMap(map, kHealerJobs, 'healer');
  addToMap(map, kDpsJobs, 'dps');
  addToMap(map, kCraftingJobs, 'crafter');
  addToMap(map, kGatheringJobs, 'gatherer');

  return new Proxy(map, {
    get: function (target, element) {
      if (target.has(element))
        return target.get(element);
      console.log(`Unknown job role ${element}`);
      return '';
    },
  });
})();