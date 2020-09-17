## Limit Break Stats Overlay

An ACT overlay for displaying limit break statistics such as exact amount, source counts, and time estimates.

This code is a modified version of the targetbars overlays written by [quisquous](https://github.com/quisquous). You can find the original code on the official [OverlayPlugin](https://github.com/ngld/OverlayPlugin) repo. 

Settings language is only available in English as I do not have the will to maintain it - sorry!

### Installation

1. Make sure you have [ngld's OverlayPlugin](https://gist.github.com/ngld/e2217563bbbe1750c0917217f136687d#how-do-i-install-overlayplugin-or-cactbot) installed.
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
* `Counters (Survival)`: The amount of times you have generated LB through surviving LB or healing critically-low (<10%) HP. This counter increases by `2` if the source was a single-target heal. See [Sources of LB Generation](https://github.com/Makar8000/LimitBreakStats#sources-of-lb-generation) for more info.
* `Counters (Passive)`: The amount of times you have generated LB passively.
* `Counters (Unknown)`: The amount of times you have generated LB from an unknown source. Usually this is due to getting full LB. It can also happen in situations where LB is generated through mechanics, such as interrupting. See [Sources of LB Generation](https://github.com/Makar8000/LimitBreakStats#sources-of-lb-generation) for more info.


### How it Works

The logline for Limit Break updates provides information on the current state of LB, as well as the max number of LB bars. This plugin keeps a history of these lines. Each time the total LB amount is updated, we calculate the increase by subtracting the previous. We then check this increase against a map of known values to determine the source of generation. For determining the amount used for passive generation, the `PartyChanged` event is used to keep track of party size and composition.  

This method of determining the source has some problems. If the amount gained exceeds the cap for example, it will not be possible to determine the source.

You can find more information about the Limit Break logline in the [LogGuide](https://github.com/quisquous/cactbot/blob/main/docs/LogGuide.md#24-limitbreak).

### Sources of LB Generation

These numbers are specific to Shadowbringers content. 
* **Survival:** `300` per player (`100` in light parties). Surviving lethal damage using shields that would otherwise kill you. Does not consider damage mitigated through boss debuffs.
* **Healing Low HP:** `300` per player healed (`100` in light parties). Getting healed when you are below 10% HP. Amount is doubled for single-target heals. HoT ticks do not count. 
* **Passive:** `220` every `3` seconds (`75` for light parties). Having duplicate jobs will only decrease the amount per tick.
* **Mechanics:** Some mechanics, such as interrupting a boss, will generated LB. This amount varies depending on the mechanic and content.
