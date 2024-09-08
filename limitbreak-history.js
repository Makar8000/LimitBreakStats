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
  // Map job id to role
  roleMap: {},
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
    // Grabs job enum -> role map
    setRoleMap();
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

      let role = LBAmounts.roleMap[member.job];
      if (roleMap[role])
        roleMap[role]++;
      else
        roleMap[role] = 1;
    });

    if (Object.keys(LBAmounts.roleMap).length !== 0 && this.bars === 3) {
      // TODO: More research on how scaling works for non-standard parties
      if (roleMap['dps'] !== 4 || roleMap['tank'] !== 2 || roleMap['healer'] !== 2)
        jobDuplicates = Math.max(jobDuplicates, 1);
    }

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
    const results = await contentFinderReq(new Set());
    if (!Array.isArray(results))
      throw "invalid results";
    LBAmounts.passiveScales[2].zones = results;
  } catch {
    console.warn("Unable to grab HighEndDuty list. LB calculation may be incorrect when using non-standard comps on these duties.");
  }
}

const contentFinderReq = async (results, cursor) => {
  let url = `https://beta.xivapi.com/api/1/search?sheets=ContentFinderCondition&fields=TerritoryType@as(raw)`;
  if (typeof cursor === 'string') {
    url = `${url}&cursor=${cursor}`;
  } else {
    url = `${url}&query=%2BHighEndDuty=true%20%2BClassJobLevelSync%3E=${LBAmounts.minLvl}`;
  }
  const resp = await fetch(url);
  const json = await resp.json();
  json.results.forEach(r => results.add(r.fields["TerritoryType@as(raw)"]));
  if (json.next)
    return await contentFinderReq(results, json.next);
  return Array.from(results);
}

const setRoleMap = async () => {
  try {
    await classJobReq();
  } catch {
    console.warn("Unable to grab role map. LB calculation may be incorrect when using non-standard comps in high-end duties.");
  }
}

const classJobReq = async (cursor) => {
  let url = `https://beta.xivapi.com/api/1/search?sheets=ClassJob&fields=Role`;
  if (typeof cursor === 'string') {
    url = `${url}&cursor=${cursor}`;
  } else {
    url = `${url}&query=Role%3E=1`;
  }
  const resp = await fetch(url);
  const json = await resp.json();
  json.results.forEach(r => LBAmounts.roleMap[r.row_id] = roleToNameMap[r.fields.Role]);
  if (json.next)
    await classJobReq(json.next);
}

const roleToNameMap = {
  1: 'tank',
  2: 'dps', // melee
  3: 'dps', // ranged
  4: 'healer',
};