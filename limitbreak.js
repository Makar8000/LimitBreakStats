'use strict';

const overlaySettingsKey = 'limitbreak-tracker-settings';

// Setting keys
const textOptions = {
  'None': 'None',
  'Current LB': 'CurrentLB',
  'Time to Next Bar': 'TimeToBar',
  'Counters (Unknown / Survive / Heal / Passive)': 'LBCounts',
  'Passive Ticks': 'PassiveTicks',
  'Surviving Lethals': 'SurviveLethals',
  'Critical HP Heals': 'CritHeals',
  'Unknown Sources': 'UnknownSource',
};

function getOptionsForKeys(validKeys) {
  let options = {};
  for (const [value, key] of Object.entries(textOptions)) {
    if (!validKeys.includes(key))
      continue;
    options[value] = key;
  }
  return options;
}

const validSelectKeys = ['None', 'CurrentLB', 'TimeToBar', 'LBCounts'];
const selectOptions = getOptionsForKeys(validSelectKeys);
const validDetailKeys = ['CurrentLB', 'TimeToBar', 'SurviveLethals', 'CritHeals', 'PassiveTicks', 'UnknownSource'];
const detailOptions = getOptionsForKeys(validDetailKeys);

// Format Type enum
const FormatType = {
  Raw: 0,
  Separators: 1,
  Simplify3: 2,
  Simplify4: 3,
  Simplify5: 4,
};

// Formatting options specific to key
const formatOptionsByKey = {
  CurrentLB: {
    maximumFractionDigits: 0,
  },
  TimeToBar: {
    maximumFractionDigits: 0,
  },
  LBCounts: {
    maximumFractionDigits: 0,
  },
};

// Auto-generate number formatting options.
const formatOptions = (() => {
  const defaultValue = 12345;
  const defaultKey = 'CurrentLB';
  let formatOptions = {};

  for (const typeName in FormatType) {
    const type = FormatType[typeName];
    formatOptions[formatNumber(defaultValue, type, defaultKey)] = type;
  }

  return formatOptions;
})();

const configStructure = [
  {
    id: 'showBar',
    name: 'Horizontal Mode',
    type: 'checkbox',
    default: true,
  },
  {
    id: 'leftText',
    name: 'Left Text',
    type: 'select',
    optionsByType: selectOptions,
    default: 'CurrentLB',
  },
  {
    id: 'middleText',
    name: 'Middle Text',
    optionsByType: selectOptions,
    type: 'select',
    default: 'TimeToBar',
  },
  {
    id: 'rightText',
    name: 'Right Text',
    optionsByType: selectOptions,
    type: 'select',
    default: 'LBCounts',
  },
  {
    id: 'barHeight',
    name: 'Container Height',
    type: 'text',
    default: 18,
  },
  {
    id: 'barWidth',
    name: 'Container Width',
    type: 'text',
    default: 300,
  },
  {
    id: 'numberFormat',
    name: 'Number Format',
    type: 'select',
    options: formatOptions,
    default: FormatType.Separators,
  },
  {
    id: 'isRounded',
    name: 'Rounded Corners',
    type: 'checkbox',
    default: true,
  },
  {
    id: 'borderSize',
    name: 'Border Width',
    type: 'text',
    default: 1,
  },
  {
    id: 'borderColor',
    name: 'Border Color',
    type: 'text',
    default: 'black',
  },
  {
    id: 'bgColor',
    name: 'Background Color',
    type: 'text',
    default: 'rgba(0, 0, 0, 0.6)',
  },
  {
    id: 'fontSize',
    name: 'Font Size',
    type: 'text',
    default: 14,
  },
  {
    id: 'fontFamily',
    name: 'Font Family',
    type: 'text',
    default: 'Tahoma',
  },
  {
    id: 'fontColor',
    name: 'Font Color',
    type: 'text',
    default: 'white',
  }
];

// Return "str px" if "str" is a number, otherwise "str".
function defaultAsPx(str) {
  if (parseFloat(str) == str)
    return str + 'px';
  return str;
}

// Simplifies a number to number of |digits|.
// e.g. num=123456789, digits=3 => 123M
// e.g. num=123456789, digits=4 => 123.4M
// e.g. num=-0.1234567, digits=3 => -0.123
function formatNumberSimplify(num, options, digits) {
  // The leading zero does not count.
  if (num < 1)
    digits++;

  // Digits before the decimal.
  let originalDigits = Math.max(Math.floor(Math.log10(num)), 0) + 1;
  let separator = Math.floor((originalDigits - 1) / 3) * 3;

  let suffix = {
    0: '',
    3: 'k',
    6: 'M',
    9: 'B',
    12: 'T',
    15: 'Q',
  }[separator];

  num /= Math.pow(10, separator);

  let finalDigits = originalDigits - separator;
  // At least give 3 digits here even if requesting 2.
  let decimalPlacesNeeded = Math.max(digits - finalDigits, 0);

  // If this is a real decimal place, bound by the per-key formatting options.
  if (separator === 0) {
    if (typeof options.minimumFractionDigits !== 'undefined')
      decimalPlacesNeeded = Math.max(options.minimumFractionDigits, decimalPlacesNeeded);
    if (typeof options.maximumFractionDigits !== 'undefined')
      decimalPlacesNeeded = Math.min(options.maximumFractionDigits, decimalPlacesNeeded);
  }

  let shift = Math.pow(10, decimalPlacesNeeded);
  num = Math.floor(num * shift) / shift;

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlacesNeeded,
    maximumFractionDigits: decimalPlacesNeeded,
  }) + suffix;
}

function formatNumber(num, format, key) {
  let floatNum = parseFloat(num);
  if (isNaN(floatNum))
    return num;
  num = floatNum;

  const options = formatOptionsByKey[key];
  const minDigits = options.minimumFractionDigits > 0 ? options.minimumFractionDigits : 0;

  switch (parseInt(format)) {
    default:
    case FormatType.Raw:
      return num.toFixed(minDigits);

    case FormatType.Separators:
      return num.toLocaleString('en-US', options);

    case FormatType.Simplify3:
      return formatNumberSimplify(num, options, 3);

    case FormatType.Simplify4:
      return formatNumberSimplify(num, options, 4);

    case FormatType.Simplify5:
      return formatNumberSimplify(num, options, 5);
  }
}

class BarUI {
  constructor(topLevelOptions, div) {
    this.options = topLevelOptions;
    this.div = div;
    this.limitBreakHistory = new LimitBreakHistory();

    // Map of keys to elements that contain those values.
    // built from this.options.elements.
    this.elementMap = {};

    const textMap = {
      left: this.options.leftText,
      center: this.options.middleText,
      right: this.options.rightText,
    };

    if (this.options.showBar) {
      document.getElementById('settings-container').classList.remove('settings-container-tall');
      this.div.classList.remove('bar-detailed');
      for (const [justifyKey, text] of Object.entries(textMap)) {
        if (!validSelectKeys.includes(text))
          continue;

        let textDiv = document.createElement('div');
        textDiv.classList.add(text);
        textDiv.style.justifySelf = justifyKey;
        this.div.appendChild(textDiv);
        this.elementMap[text] = this.elementMap[text] || [];
        this.elementMap[text].push(textDiv);
      }
    } else {
      document.getElementById('settings-container').classList.add('settings-container-tall');
      this.div.classList.add('bar-detailed');
      for (const [value, key] of Object.entries(detailOptions)) {
        if (!validDetailKeys.includes(key))
          continue;

        let textDiv = document.createElement('div');
        textDiv.classList.add(key);
        textDiv.classList.add('detailed');
        this.div.appendChild(textDiv);
        this.elementMap[key] = this.elementMap[key] || [];
        this.elementMap[key].push(textDiv);
      }
    }

    if (this.options.isRounded)
      this.div.classList.add('rounded');
    else
      this.div.classList.remove('rounded');

    this.div.style.height = defaultAsPx(this.options.barHeight);
    this.div.style.width = defaultAsPx(this.options.barWidth);

    let borderStyle = defaultAsPx(this.options.borderSize);
    borderStyle += ' solid ' + this.options.borderColor;
    this.div.style.border = borderStyle;

    this.div.style.fontSize = defaultAsPx(this.options.fontSize);
    this.div.style.fontFamily = this.options.fontFamily;
    this.div.style.color = this.options.fontColor;
    this.div.style.background = this.options.bgColor;

    // Alignment hack:
    // align-self:center doesn't work when children are taller than parents.
    // TODO: is there some better way to do this?
    const containerHeight = parseInt(this.div.clientHeight);
    for (const el in this.elementMap) {
      for (let div of this.elementMap[el]) {
        // Add some text to give div a non-zero height.
        div.innerText = 'XXX';
        let divHeight = div.clientHeight;
        div.innerText = '';
        if (divHeight <= containerHeight)
          continue;
        div.style.position = 'relative';
        div.style.top = defaultAsPx((containerHeight - divHeight) / 2.0);
      }
    }

    this.update({ line: ['36', undefined, '0000'] });
  }

  update(e) {
    // 36|2020-09-14T20:37:53.2140000-05:00|3CA0|3|hash

    const [logCode, logTimeStamp, hexValue] = e.line;
    if (logCode !== '36')
      return;

    // Process LB
    this.limitBreakHistory.processLB(hexValue);
    //this.limitBreakHistory.processLB(hexValue);

    // Update current LB
    const currentLBKey = 'CurrentLB';
    const formattedCurrentLB = formatNumber(this.limitBreakHistory.getCurrentValue(), this.options.numberFormat, currentLBKey);
    this.setValue(currentLBKey, formattedCurrentLB);

    // Update time until next bar
    this.setValue('TimeToBar', this.limitBreakHistory.formattedTimeToBar());

    // Update counts
    this.setValue('LBCounts', `${this.limitBreakHistory.unknownCnt} / ${this.limitBreakHistory.surviveLethalCnt} / ${this.limitBreakHistory.healCritCnt} / ${this.limitBreakHistory.passiveCnt}`);
  }

  updateParty(party) {
    // Updates the job duplicate counter
    let jobMap = {};
    let duplicates = 0;
    party.filter(member => member.inParty).forEach(member => {
      if (jobMap[member.job])
        duplicates++;
      jobMap[member.job] = true;
    });
    this.limitBreakHistory.jobDuplicates = duplicates;
  }

  setValue(name, value) {
    let nodes = this.elementMap[name];
    if (!nodes)
      return;
    for (let node of nodes)
      node.innerText = value;
  }
}

class SettingsUI {
  constructor(configStructure, savedConfig, settingsDiv, rebuildFunc) {
    this.savedConfig = savedConfig || {};
    this.div = settingsDiv;
    this.rebuildFunc = rebuildFunc;

    this.buildUI(settingsDiv, configStructure, savedConfig);

    rebuildFunc(savedConfig);
  }

  // Top level UI builder, builds everything.
  buildUI(container, configStructure, savedConfig) {
    container.appendChild(this.buildHeader());
    container.appendChild(this.buildHelpText());
    for (const opt of configStructure) {
      let buildFunc = {
        checkbox: this.buildCheckbox,
        select: this.buildSelect,
        text: this.buildText,
      }[opt.type];
      if (!buildFunc) {
        console.error('unknown type: ' + JSON.stringify(opt));
        continue;
      }

      buildFunc.bind(this)(container, opt);
    }
  }

  buildHeader() {
    let div = document.createElement('div');
    div.innerHTML = 'Limit Break Settings';
    div.classList.add('settings-title');
    return div;
  }

  buildHelpText() {
    let div = document.createElement('div');
    div.innerHTML = '(🔒lock overlay to hide settings)';
    div.classList.add('settings-helptext');
    return div;
  }

  // Code after this point in this class is largely cribbed from cactbot's
  // ui/config/config.js CactbotConfigurator.
  // If this gets used again, maybe it should be abstracted.

  async saveConfigData() {
    await callOverlayHandler({
      call: 'saveData',
      key: overlaySettingsKey,
      data: this.savedConfig,
    });
    this.rebuildFunc(this.savedConfig);
  }

  // takes variable args, with the last value being the default value if
  // any key is missing.
  // e.g. (foo, bar, baz, 5) with {foo: { bar: { baz: 3 } } } will return
  // the value 3.  Requires at least two args.
  getOption() {
    let num = arguments.length;
    if (num < 2) {
      console.error('getOption requires at least two args');
      return;
    }

    let defaultValue = arguments[num - 1];
    let objOrValue = this.savedConfig;
    for (let i = 0; i < num - 1; ++i) {
      objOrValue = objOrValue[arguments[i]];
      if (typeof objOrValue === 'undefined')
        return defaultValue;
    }

    return objOrValue;
  }

  // takes variable args, with the last value being the 'value' to set it to
  // e.g. (foo, bar, baz, 3) will set {foo: { bar: { baz: 3 } } }.
  // requires at least two args.
  setOption() {
    let num = arguments.length;
    if (num < 2) {
      console.error('setOption requires at least two args');
      return;
    }

    // Set keys and create default {} if it doesn't exist.
    let obj = this.savedConfig;
    for (let i = 0; i < num - 2; ++i) {
      let arg = arguments[i];
      obj[arg] = obj[arg] || {};
      obj = obj[arg];
    }
    // Set the last key to have the final argument's value.
    obj[arguments[num - 2]] = arguments[num - 1];
    this.saveConfigData();
  }

  buildNameDiv(opt) {
    let div = document.createElement('div');
    div.innerHTML = opt.name;
    div.classList.add('option-name');
    return div;
  }

  buildCheckbox(parent, opt) {
    let div = document.createElement('div');
    div.classList.add('option-input-container');

    let input = document.createElement('input');
    div.appendChild(input);
    input.type = 'checkbox';
    input.checked = this.getOption(opt.id, opt.default);
    input.onchange = () => this.setOption(opt.id, input.checked);

    parent.appendChild(this.buildNameDiv(opt));
    parent.appendChild(div);
  }

  // <select> inputs don't work in overlays, so make a fake one.
  buildSelect(parent, opt) {
    let div = document.createElement('div');
    div.classList.add('option-input-container');
    div.classList.add('select-container');

    // Build the real select so we have a real input element.
    let input = document.createElement('select');
    input.classList.add('hidden');
    div.appendChild(input);

    const defaultValue = this.getOption(opt.id, opt.default);
    input.onchange = () => this.setOption(opt.id, input.value);

    const innerOptions = opt.optionsByType ? opt.optionsByType : opt.options;
    for (const [key, value] of Object.entries(innerOptions)) {
      let elem = document.createElement('option');
      elem.value = value;
      elem.innerHTML = key;
      if (value === defaultValue)
        elem.selected = true;
      input.appendChild(elem);
    }

    parent.appendChild(this.buildNameDiv(opt));
    parent.appendChild(div);

    // Now build the fake select.
    let selectedDiv = document.createElement('div');
    selectedDiv.classList.add('select-active');
    selectedDiv.innerHTML = input.options[input.selectedIndex].innerHTML;
    div.appendChild(selectedDiv);

    let items = document.createElement('div');
    items.classList.add('select-items', 'hidden');
    div.appendChild(items);

    selectedDiv.addEventListener('click', (e) => {
      items.classList.toggle('hidden');
    });

    // Popout list of options.
    for (let idx = 0; idx < input.options.length; ++idx) {
      let optionElem = input.options[idx];
      let item = document.createElement('div');
      item.classList.add('select-item');
      item.innerHTML = optionElem.innerHTML;
      items.appendChild(item);

      item.addEventListener('click', (e) => {
        input.selectedIndex = idx;
        input.onchange();
        selectedDiv.innerHTML = item.innerHTML;
        items.classList.toggle('hidden');
        selectedDiv.classList.toggle('select-arrow-active');
      });
    }
  }

  buildText(parent, opt) {
    let div = document.createElement('div');
    div.classList.add('option-input-container');

    let input = document.createElement('input');
    div.appendChild(input);
    input.type = 'text';
    input.value = this.getOption(opt.id, opt.default);
    let setFunc = () => this.setOption(opt.id, input.value);
    input.onchange = setFunc;
    input.oninput = setFunc;

    parent.appendChild(this.buildNameDiv(opt));
    parent.appendChild(div);
  }
}

function updateOverlayState(e) {
  let settingsContainer = document.getElementById('settings-container');
  if (!settingsContainer)
    return;
  const locked = e.detail.isLocked;
  if (locked) {
    settingsContainer.classList.add('hidden');
    document.body.classList.remove('resize-background');
  } else {
    settingsContainer.classList.remove('hidden');
    document.body.classList.add('resize-background');
  }
  OverlayPluginApi.setAcceptFocus(!locked);
}

// This event comes early and doesn't depend on any other state.
// So, add the listener before DOMContentLoaded.
document.addEventListener('onOverlayStateUpdate', updateOverlayState);

window.addEventListener('DOMContentLoaded', async (e) => {
  // Get the container for the bar
  let containerDiv = document.getElementById('container-limitbreak');
  if (!containerDiv) {
    console.error('Missing container');
    return;
  }

  // Set option defaults from config.
  let options = {};
  for (const opt of configStructure)
    options[opt.id] = opt.default;

  // Overwrite options from loaded values. 
  const loadResult = await window.callOverlayHandler({ call: 'loadData', key: overlaySettingsKey });
  if (loadResult && loadResult.data)
    options = Object.assign(options, loadResult.data);

  // Creating settings will build the initial bars UI.
  // Changes to settings rebuild the bars.
  let barUI;
  let settingsDiv = document.getElementById('settings');
  let buildFunc = (options) => {
    while (containerDiv.lastChild)
      containerDiv.removeChild(containerDiv.lastChild);
    barUI = new BarUI(options, containerDiv);
  };
  let gSettingsUI = new SettingsUI(configStructure, options, settingsDiv, buildFunc);

  window.addOverlayListener('LogLine', (e) => barUI.update(e));
  window.addOverlayListener('PartyChanged', (e) => barUI.updateParty(e.party));
  document.addEventListener('onExampleShowcase', () => barUI.update({ line: ['36', undefined, '0000'] }));
  window.startOverlayEvents();
});
