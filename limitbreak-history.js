'use strict';

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
    this.history = [0];
    this.jobDuplicates = 0;
    this.surviveLethalCnt = 0;
    this.healCritCnt = 0;
    this.passiveCnt = 0;

    // Source of LB is unknown
    this.unknownCnt = 0;
  }

  updateHistory(hex) {
    // Get the current total amount of LB
    const currentLB = Number.parseInt(hex, 16);
    if (!currentLB) {
      // Reset history if current value is 0
      this.resetLB();
      return;
    }

    // Add new value to history
    this.hist.push(currentLB);
    this.updateCounters();
  }

  updateCounters() {
    const counters = {
      surviveLethalCnt: 0,
      healCritCnt: 0,
      passiveCnt: 0,
      unknownCnt: 0,
    }

    for (let i = 1; i < this.hist.length; i++) {
      const generatedLB = this.hist[i] - this.hist[i - 1];
      if (generatedLB <= 0)
        return;

      switch (generatedLB) {
        case LBAmounts.surviveLethal:
          counters.surviveLethalCnt = counters.surviveLethalCnt + 1;
          break;
        case LBAmounts.healCritical:
          counters.healCritCnt = counters.healCritCnt + 1;
          break;
        case LBAmounts.passiveNonDup:
          counters.passiveCnt = counters.passiveCnt + 1;
          break;
        default:
          console.log("Unknown Amount: " + generatedLB, this.hist);
          counters.unknownCnt = counters.unknownCnt + 1;
      }
    }

    this.surviveLethalCnt = counters.surviveLethalCnt;
    this.healCritCnt = counters.healCritCnt;
    this.passiveCnt = counters.passiveCnt;
    this.unknownCnt = counters.unknownCnt;
  }

  resetLB() {
    // Reset history and counts
    this.hist = [0];
    this.surviveLethalCnt = 0;
    this.healCritCnt = 0;
    this.passiveCnt = 0;
    this.unknownCnt = 0;
  }

  secondsUntilNextBar() {
    // Calculate the number of seconds until the next LB bar.
    const currentLB = this.getCurrentValue();
    // TODO: determine gen amount for duplicates and determine duplicates via PartyChanged event.
    const passiveGen = LBAmounts.passiveNonDup;
    const amountUntilNextBar = LBAmounts.barSize - (currentLB % LBAmounts.barSize);
    const secondUntilNextBar = (amountUntilNextBar / passiveGen) * LBAmounts.passiveFrequency;
    return Math.ceil(secondUntilNextBar / 3) * 3;
  }

  formattedTimeToBar() {
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
}