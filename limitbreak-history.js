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
    zones: [],
  }, {
    // Two bars
    scale: [180],
    zones: [],
  }, {
    // Three bars
    scale: [220, 170, 160, 154, 144, 140],
    // High-end duty Zone IDs
    // Obtained from TerritoryType / ContentFinderCondition
    zones: [],
  }],
  // Limits dimishing to 5.x+ content
  minLvl: 80,
};

// Records limit break value history
class LimitBreakHistory {
  constructor() {
    // History
    this.hist = [];
    // Max Number of LB Bars
    this.bars = 1;
    // Party info
    this.jobDuplicates = 0;
    // Zone ID
    this.zoneID = 0;
    // Surviving Lethal or Healing Critical
    // Increases by 2 if the source was a single-target heal
    this.surviveLethalCnt = 0;
    // Passive LB Generation
    this.passiveCnt = 0;
    // Source of LB is unknown
    this.unknownCnt = 0;
    // Grab HighEndDuty zones
    setHighEndZones();
  }

  updateHistory(hex, stringBars) {
    // Get the max number of bars
    const bars = Number.parseInt(stringBars, 10);
    // Get the current total amount of LB
    const currentLB = Number.parseInt(hex, 16);
    let shouldUpdateCounters = true;

    // Reset history if current value is 0 or max bars has changed.
    if (!currentLB || (this.bars !== bars)) {
      shouldUpdateCounters = false;
      this.reset();
    }

    // Update max number of bars
    this.bars = bars;

    // Add new value to history
    this.hist.push(currentLB);

    // Update Counters
    if (shouldUpdateCounters)
      this.updateCounters();
  }

  updateParty(alliance) {
    // Updates the job duplicate counter
    let jobDuplicates = 0;
    const jobMap = {};
    const roleMap = {};
    // [{ id, name, worldId, job, inParty }]
    alliance.filter(member => member.inParty).forEach(member => {
      if (jobMap[member.job])
        jobDuplicates++;
      jobMap[member.job] = true;

      let role = jobToRoleMap[kJobEnumToName[member.job]];
      if (roleMap[role])
        roleMap[role]++;
      else
        roleMap[role] = 1;
    });

    // TODO: More research on how scaling works for non-standard parties
    if (this.bars === 3 && (roleMap['dps'] !== 4 || roleMap['tank'] !== 2 || roleMap['healer'] !== 2))
      jobDuplicates = Math.max(jobDuplicates, 1);

    this.jobDuplicates = jobDuplicates;
  }

  updateZone(zoneID) {
    this.zoneID = zoneID;
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
    this.hist = [];
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

  getLBAmountsForParty() {
    const bars = Math.min(Math.max(this.bars, 1), LBAmounts.passiveScales.length);
    const scale = LBAmounts.passiveScales[bars - 1].scale;
    const shouldDiminish = LBAmounts.passiveScales[bars - 1].zones.includes(this.zoneID);

    return {
      surviveLethal: LBAmounts.surviveLethalScale * bars,
      passive: shouldDiminish ? scale[Math.min(this.jobDuplicates, scale.length - 1)] : scale[0]
    };
  }

  getCurrentValue() {
    return this.hist[this.hist.length - 1];
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

const setHighEndZones = async () => {
  try {
    const results = await contentFinderReq({}, 1);
    if (!Array.isArray(results)) throw "invalid results";
    LBAmounts.passiveScales[2].zones = results;
  } catch {
    console.warn("Unable to grab HighEndDuty list. LB calculation may be incorrect when using non-standard comps on these duties.");
  }
}

const contentFinderReq = async (results, page) => {
  const resp = await fetch(`https://xivapi.com/ContentFinderCondition?columns=HighEndDuty,TerritoryType.ID,ClassJobLevelSync&page=${page}`);
  const json = await resp.json();
  json.Results.filter(r => r.HighEndDuty === 1 && r.ClassJobLevelSync >= LBAmounts.minLvl).forEach(r => results[r.TerritoryType.ID] = true);
  if (json.Pagination.PageNext)
    return await contentFinderReq(results, json.Pagination.PageNext);
  return Object.keys(results).map(r => parseInt(r));
}

// Credit / Taken from: https://github.com/quisquous/cactbot/pull/1794
const kTankJobs = ['GLA', 'PLD', 'MRD', 'WAR', 'DRK', 'GNB'];
const kHealerJobs = ['CNJ', 'WHM', 'SCH', 'AST', 'SGE'];
const kMeleeDpsJobs = ['PGL', 'MNK', 'LNC', 'DRG', 'ROG', 'NIN', 'SAM', 'RPR'];
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
  39: 'RPR',
  40: 'SGE',
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