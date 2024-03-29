## Limit Break Stats Overlay

**This overlay is a work-in-progress.** Some information, such as passive generation in non-standard parties, is not completed yet.

An ACT overlay for displaying limit break statistics such as exact amount, source counts, and time estimates.

This code is a modified version of the targetbars overlays written by [quisquous](https://github.com/quisquous). You can find the original code on the official [OverlayPlugin](https://github.com/OverlayPlugin/OverlayPlugin/) repo. 

English is the only language option available as I do not have the will to maintain multi-language support - sorry!

### Installation

1. Make sure you have the latest [OverlayPlugin](https://overlayplugin.github.io/docs/setup/#overlayplugin) installed.
2. Go to `Plugins` tab -> `OverlayPlugin.dll` tab -> Click on `New`.
3. Enter anything for the name (ex. LBStats) and in the Preset dropdown select `Custom` -> `MiniParse`.
4. Click on the Overlay you just created on the left panel, and scroll down to the URL field.
5. Set the URL to `https://makar8000.github.io/LimitBreakStats/`.
6. Click on `Reload overlay`.
7. When you are done modifying your settings, you can check the boxes for `Lock overlay` and `Enable clickthrough`.


### Fields

* `Current LB`: The exact amount of LB that you currently have. Each LB bar is `10,000` points.
* `Time to Next Bar`: The estimated amount of time until your next bar. This is assuming passive-only generation.
* `Time to Max` The estimated amount of time until you hit LB cap. This is assuming passive-only generation.
* `Counters (Survival)`: The amount of times you have generated LB through surviving lethal damage or healing critically-low (<10%) HP. This counter increases by `2` if the source was a single-target heal. See [Sources of LB Generation](https://github.com/Makar8000/LimitBreakStats#sources-of-lb-generation) for more info.
* `Counters (Passive)`: The amount of times you have generated LB passively.
* `Counters (Unknown)`: The amount of times you have generated LB from an unknown source. Usually this is due to getting full LB. It can also happen in situations where LB is generated through mechanics, such as interrupting. See [Sources of LB Generation](https://github.com/Makar8000/LimitBreakStats#sources-of-lb-generation) for more info.


### How it Works

The logline for Limit Break updates provides information on the current state of LB, as well as the max number of LB bars. This overlay keeps a history of these lines. Each time the total LB amount is updated, it calculates the increase by subtracting the previous. It then checks this increase against a map of known values to determine the source of generation. For determining the amount used for passive generation, the `PartyChanged` event is used to keep track of party composition.  

This method of determining the source has some problems. If the amount gained exceeds the cap for example, it will not be possible to determine the source.

You can find more information about the Limit Break logline in the [LogGuide](https://github.com/quisquous/cactbot/blob/main/docs/LogGuide.md#24-limitbreak).

### Caveats or bugs

* The overlay is not able to reliably determine the source of generation for the last tick, since the excess amount is clipped.
* The counters will reset when the max number of LB bars changes, such as alliance raids or the last boss in dungeons.
* Pre-shadowbringers content is not supported.

### Sources of LB Generation

These numbers are specific to Shadowbringers+ content. The amount you generate scales with the max number of Limit Break bars the party can have. Each LB bar is `10,000` points.
* **Survival:** `100` / `200` / `300` per player. Surviving damage using shields or buffs that would otherwise kill you. The damage used to determine this is the raw damage dealt after factoring in debuffs on the enemy.
* **Healing Low HP:** `100` / `200` / `300` per player healed. Getting healed when you are below 10% HP. This amount is doubled for single-target heals. HoT ticks do not count. 
* **Passive:** `75` / `180` / `220` every three seconds. Having duplicate jobs or a non-standard comp in a "High-end Duty" will decrease the amount per tick. The scaling for this is as follows: `220 > 170 > 160 > 154 > 144 > 140`.
* **Mechanics:** Some mechanics, such as interrupting a boss, will generate LB. This amount varies depending on the mechanic and content.

### More Information

For more information about how Limit Break works in general, please see this [document](https://docs.google.com/document/d/1JK9BKbW49Kye5V60jD16rvzmliurLE1Ngq6Z7-WubKI/) created by [Allagan Studies](https://www.akhmorning.com/allagan-studies/).
