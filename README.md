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
* `Counters (Survival)`: The amount of times you have generated LB through surviving LB or healing critically-low (<10%) HP. This counter increases by `2` for every player who survived lethal damage, and `1` for every player who was healed after having critically-low HP. This is because the amount gained from survival is twice the amount gained from heals. See [How it Works](https://github.com/Makar8000/LimitBreakStats#how-it-works) for more info.
* `Counters (Passive)`: The amount of times you have generated LB passively.
* `Counters (Unknown)`: The amount of times you have generated LB from an unknown source. Usually this is due to getting full LB. It can also happen in situations where LB is generated through mechanics, such as interrupting. See [Sources of LB Generation](https://github.com/Makar8000/LimitBreakStats#sources-of-lb-generation) for more info.


### How it Works

The logline for Limit Break updates provides information on the current state of LB, as well as the max number of LB bars. This plugin keeps a history of these lines. Each time the total LB amount is updated, we calculate the increase by subtracting the previous. We then check this increase against a map of known values to determine the source of generation. For determining the amount used for passive generation, the `PartyChanged` event is used to keep track of party size and composition.  

This method of determining the source has some problems, because the lines added when healing critically-low HP within the server tick are combined. For example, if two players were healed at the same time, the amount would be the same as surviving lethal damage - making it impossible to determine the source from the Limit Break logline alone. 

Another issue with this method comes when having a full LB bar, since the amount gained may exceed the cap.

You can find more information about the Limit Break logline in the [LogGuide](https://github.com/quisquous/cactbot/blob/main/docs/LogGuide.md#24-limitbreak).

### Sources of LB Generation

These numbers are specific to Shadowbringers content. 
* **Survival:** `300` per player. Surviving lethal damage using shields that would otherwise kill you. Does not consider damage mitigated through boss debuffs.
* **Healing Low HP:** `150` per player healed. Getting healed when you are below 10% HP. HoT ticks do not count. 
* **Passive:** `220` for full parties, `75` for light parties. This happens every `3` seconds. Having duplicate jobs will only decrease the amount per tick.
* **Mechanics:** Some mechanics, such as interrupting a boss, will generated LB. This amount varies depending on the mechanic and content.
