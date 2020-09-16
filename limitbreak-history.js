'use strict';

// LB data for 5.x+ content
// TODO: Support <5.x based on zoneID? 
const LBAmounts = {
  // Amount per LB Bar
  barSize: 10000,
  // Surviving lethal damage.
  surviveLethal: 300,
  // Healing critical (<10%) HP.
  healCritical: 150,
  // Passive generation for non-duplicate comps.
  passiveNonDup: 220,
  // Frequency of passive generation (in seconds).
  passiveFrequency: 3,
};

// Records limit break value history
class LimitBreakHistory {
  constructor() {
    // History
    this.hist = [0];
    // Max Number of LB Bars
    this.bars = 2;
    // Party info
    this.party = {
      jobDuplicates: 0,
      // { id, name, worldId, job, inParty }
      list: []
    };
    // Surviving Lethal + 2, Healing Critical + 1
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
    this.bars = bars;
    this.updateCounters();
  }

  updateCounters() {
    const counters = {
      surviveLethalCnt: 0,
      passiveCnt: 0,
      unknownCnt: 0,
    }

    for (let i = 1; i < this.hist.length; i++) {
      const generatedLB = this.hist[i] - this.hist[i - 1];

      // No gain or LB is reset
      if (generatedLB <= 0)
        continue;

      // Passive ticks
      if (generatedLB === this.getPassiveIncrease()) {
        counters.passiveCnt = counters.passiveCnt + 1;
        continue;
      }

      // Surviving Lethal (+2) or Healing <10% HP (+1)
      if (generatedLB % LBAmounts.healCritical === 0) {
        counters.surviveLethalCnt = counters.surviveLethalCnt + (generatedLB / 150);
        continue;
      }

      // Source is unknown
      if (this.hist[i] !== this.bars * LBAmounts.barSize)
        console.log("Unknown Amount: " + generatedLB, this.hist);
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
    const currentLB = this.getCurrentValue();
    const passiveGen = this.getPassiveIncrease();
    const amountUntilNextBar = LBAmounts.barSize - (currentLB % LBAmounts.barSize);
    const secondUntilNextBar = (amountUntilNextBar / passiveGen) * LBAmounts.passiveFrequency;
    return Math.ceil(secondUntilNextBar / 3) * 3;
  }

  formattedTimeToBar() {
    // Formatted time string #m#s
    const currentLB = this.getCurrentValue();
    if (!currentLB)
      return '';

    const secondsUntilNextBar = this.secondsUntilNextBar();
    const intSeconds = Math.floor(secondsUntilNextBar);
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

  getPassiveIncrease() {
    // TODO: determine passive amounts based on party comp
    return LBAmounts.passiveNonDup;
  }
}