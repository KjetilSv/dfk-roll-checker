# Kjetil'S Awesome Roll Checker (DFK)

A Chrome extension for **DeFi Kingdoms** that reads your hero's Meditation Results and instantly tells you whether your HP and MP level-up rolls were Small, Regular, or Large — with probability bars per class.

![Extension popup showing HP/MP roll result](https://raw.githubusercontent.com/KjetilSv/dfk-roll-checker/master/screenshot.png)

## Features

- 🟣 Detects **Small / Regular / Large** roll for both HP and MP
- 📊 Shows **roll chance bars** per hero class (e.g. Monk: 25/35/40% HP)
- ⚡ One click — reads directly from the Meditation Results page
- 🎯 "Great Roll" verdict when **both** HP and MP are Large
- No data collection, no servers, fully local

## Installation (Developer Mode — free)

Chrome Web Store approval takes time and costs $5. Install directly instead:

1. [Download the ZIP](https://github.com/KjetilSv/dfk-roll-checker/archive/refs/heads/master.zip) and unzip **or** clone the repo:
   ```
   git clone https://github.com/KjetilSv/dfk-roll-checker.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle, top right)
4. Click **Load unpacked**
5. Select the folder (`dfk-roll-checker` / `levelup-ext`)
6. The extension icon appears in your toolbar 🎲

## How to use

1. Level up a hero in DeFi Kingdoms — stay on the **Meditation Results** screen
2. Click the extension icon in Chrome
3. Click **"Read from Meditation Results"**
4. See your roll result instantly!

## Formulas used

**HP gain:**
```
Small   = floor(10 + VIT / 2)
Regular = floor(20 + VIT)
Large   = floor(30 + VIT × 1.5)
```

**MP gain (observed in-game):**
```
base    = 0.6 × INT + 0.4 × WIS
Small   = floor(2 + base × 0.075)
Regular = floor(5 + base × 0.150)
Large   = floor(9 + base × 0.225)
```

Class roll probabilities from the [DFK Growth Rates spreadsheet](https://docs.google.com/spreadsheets/d/1jfG6E6otW1V6ZLQycF5DumoBr_LrpQaz7cTmDPpwV2s/).

## Privacy

No data is collected or transmitted. See [privacy_policy.md](privacy_policy.md).

## License

MIT — use freely, credit appreciated.
