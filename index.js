const fs = require('fs');
let input = fs.readFileSync('./input.txt').toString();
input = input.split(',').map(n => Number(n));

const ParamMode = Object.freeze({ position: '0', immediate: '1' });

const nextInstIndex = (instIndex, TESTdiagProg) => {
  let res = instIndex;
  const inst = TESTdiagProg[instIndex].toString().padStart(5, '0');
  const opCode = inst[3].toString() + inst[4].toString();

  if (opCode === '01' || opCode === '02' || opCode === '07' || opCode === '08') {
    res += 4;
  } else if (opCode === '03' || opCode === '04') {
    res += 2;
  } else if (opCode === '05' || opCode === '06') {
    res += 3;
  }

  return res;
};

const runOpCode = (instIndex, TESTdiagProg, arrayInputInst, logOutputsYN = true) => {
  const inst = TESTdiagProg[instIndex].toString().padStart(5, '0');
  const opCode = inst[3].toString() + inst[4].toString();
  const modeFirstParam = inst[2].toString();
  const modeSecondParam = inst[1].toString();
  //const modeThirdParam = inst[0].toString();
  let firstInputIndex = null;

  let jumpToIndex = null;
  let output = null;

  if (opCode === '03') {
    firstInputIndex === null ? (firstInputIndex = instIndex) : (firstInputIndex = null);
    const inputIndex = TESTdiagProg[instIndex + 1];

    TESTdiagProg[inputIndex] = arrayInputInst[0];
    arrayInputInst.length > 1 && arrayInputInst.shift();
  } else if (opCode === '99') {
    return { success: false, jumpToIndex: jumpToIndex, output: output };
  } else {
    const auxArg1 = TESTdiagProg[instIndex + 1];
    const arg1 = modeFirstParam === ParamMode.immediate ? auxArg1 : TESTdiagProg[auxArg1];
    const auxArg2 = TESTdiagProg[instIndex + 2];
    const arg2 = modeSecondParam === ParamMode.immediate ? auxArg2 : TESTdiagProg[auxArg2];
    const saveIndex = TESTdiagProg[instIndex + 3];

    switch (opCode) {
      case '01':
        TESTdiagProg[saveIndex] = arg1 + arg2;
        break;
      case '02':
        TESTdiagProg[saveIndex] = arg1 * arg2;
        break;
      case '04':
        logOutputsYN && console.log(arg1);
        output = arg1;
        break;
      case '05':
        jumpToIndex = arg1 !== 0 ? arg2 : null;
        break;
      case '06':
        jumpToIndex = arg1 === 0 ? arg2 : null;
        break;
      case '07':
        TESTdiagProg[saveIndex] = arg1 < arg2 ? 1 : 0;
        break;
      case '08':
        TESTdiagProg[saveIndex] = arg1 === arg2 ? 1 : 0;
        break;
      default:
        break;
    }
  }

  return { success: true, jumpToIndex: jumpToIndex, output: output };
};

const runProgram = (arrayInputInst, diagProg, isPart2 = false, instIndex = 0) => {
  let auxProg = [...diagProg];
  let executeOpCode = {};
  let output = null;
  let countOutputs = 0;

  while (true) {
    executeOpCode = runOpCode(instIndex, auxProg, arrayInputInst, false);

    if (!executeOpCode.success) {
      break;
    }

    if (executeOpCode.output !== null) {
      output = executeOpCode.output;
      if (isPart2) {
        return { output: output, prog: auxProg, exit: !executeOpCode.success, isWaitingInst: instIndex + 2 };
      }
    }

    const jumpToIndex = executeOpCode.jumpToIndex;

    if (jumpToIndex === null) {
      instIndex = nextInstIndex(instIndex, auxProg);
    } else {
      instIndex = jumpToIndex;
    }
  }
  return { output: output, prog: auxProg, exit: !executeOpCode.success, isWaitingInst: 0 };
};

const runAmplifierSoftware = (arrayPhaseSettings, diagProg, isPart2 = false) => {
  let amplifierOutput = 0;
  let listAmp = [];
  let auxProg = diagProg;

  for (const phaseSetting of arrayPhaseSettings) {
    let resultRunProg = runProgram([phaseSetting, amplifierOutput], auxProg, true);

    amplifierOutput = resultRunProg.output;
    listAmp.push({
      phaseSetting: phaseSetting,
      prog: resultRunProg.prog,
      output: amplifierOutput,
      exit: resultRunProg.exit,
      isWaitingInst: resultRunProg.isWaitingInst
    });
  }

  const lastAmplifier = listAmp[listAmp.length - 1];

  if (isPart2) {
    while (!lastAmplifier.exit) {
      for (const amplifier of listAmp) {
        let resultRunProg = runProgram([amplifierOutput], amplifier.prog, true, amplifier.isWaitingInst);

        amplifier.prog = resultRunProg.prog;
        amplifierOutput = resultRunProg.output;
        amplifier.exit = resultRunProg.exit;

        if (amplifier === lastAmplifier && amplifier.exit) {
          break;
        }

        amplifier.output = amplifierOutput;
        amplifier.isWaitingInst = resultRunProg.isWaitingInst;
      }
      //console.log(listAmp.map(i => i.output));
    }
  }

  return lastAmplifier.output;
};

const nextPhaseSettingsPermutation = (arrayPhaseSettings, isPart2 = false) => {
  let result = '';

  if (isPart2) {
    result = nextPhaseSettings(arrayPhaseSettings, 5, 9);
  } else {
    result = nextPhaseSettings(arrayPhaseSettings, 0, 4);
  }

  while (true) {
    if (isPart2) {
      if (
        !result.includes('5') ||
        !result.includes('6') ||
        !result.includes('7') ||
        !result.includes('8') ||
        !result.includes('9')
      ) {
        result = nextPhaseSettings(arrayPhaseSettings, 5, 9);
      } else {
        break;
      }
    } else {
      if (
        !result.includes('0') ||
        !result.includes('1') ||
        !result.includes('2') ||
        !result.includes('3') ||
        !result.includes('4')
      ) {
        result = nextPhaseSettings(arrayPhaseSettings, 0, 4);
      } else {
        break;
      }
    }
  }

  return result;
};

const nextPhaseSettings = (arrayPhaseSettings, minV, maxV) => {
  for (let i = arrayPhaseSettings.length - 1; i >= 0; i--) {
    if (arrayPhaseSettings[i] >= minV && arrayPhaseSettings[i] < maxV) {
      arrayPhaseSettings[i]++;
      break;
    } else if (arrayPhaseSettings[i] == maxV) {
      arrayPhaseSettings[i] = minV;
    }
  }

  return arrayPhaseSettings.join('');
};

const highestSignal = (diagProg, isPart2 = false) => {
  let power = 0;
  let strPhaseSettings = '01234';
  let lastStrPhaseSettings = '43210';
  let bestPhaseSettings = strPhaseSettings;

  if (isPart2) {
    strPhaseSettings = '56789';
    lastStrPhaseSettings = '98765';
  }

  while (true) {
    const arrayPhaseSettings = strPhaseSettings.split('').map(i => Number(i));
    const auxPower = runAmplifierSoftware(arrayPhaseSettings, diagProg, isPart2);
    if (auxPower > power) {
      power = auxPower;
      bestPhaseSettings = strPhaseSettings;
    }

    if (strPhaseSettings === lastStrPhaseSettings) {
      break;
    } else {
      strPhaseSettings = nextPhaseSettingsPermutation(arrayPhaseSettings, isPart2);
    }
  }

  //console.log(bestPhaseSettings);
  return power;
};

console.log(highestSignal(input));
console.log(highestSignal(input, true));