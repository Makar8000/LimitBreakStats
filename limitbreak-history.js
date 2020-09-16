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

  processLB(hex) {
    // Get the current total amount of LB
    const currentLB = Number.parseInt(hex, 16);
    if (!currentLB) {
      // Reset history if current value is 0
      this.resetLB();
      return;
    }

    // Add new value to history
    const previousLB = this.getCurrentValue();
    this.hist.push(currentLB);

    // Update counters
    const generatedLB = currentLB - previousLB;
    switch (generatedLB) {
      case LBAmounts.surviveLethal:
        this.surviveLethalCnt = this.surviveLethalCnt + 1;
        break;
      case LBAmounts.healCritical:
        this.healCritCnt = this.healCritCnt + 1;
        break;
      case LBAmounts.passiveNonDup:
        this.passiveCnt = this.passiveCnt + 1;
        break;
      default:
        this.unknownCnt = this.unknownCnt + 1;
    }
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
    return secondUntilNextBar;
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