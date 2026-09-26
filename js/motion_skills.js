(function (global) {
  "use strict";

  // Visible motion skills from instinct_motion_plan.csv (show = 显示).
  const GROUPS = Object.freeze({
    walking: Object.freeze([
      Object.freeze({ command: "kvtF", labelKey: "gaitStep", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kvtL", labelKey: "gaitSpinLeft", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kvtR", labelKey: "gaitSpinRight", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kwkF", labelKey: "gaitWalkForward", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kwkL", labelKey: "gaitWalkLeft", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kwkR", labelKey: "gaitWalkRight", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kbkF", labelKey: "gaitWalkBackward", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kbkL", labelKey: "gaitBackLeft", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kbkR", labelKey: "gaitBackRight", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "ktrF", labelKey: "gaitTrotForward", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "ktrL", labelKey: "gaitTrotLeft", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "ktrR", labelKey: "gaitTrotRight", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kcrF", labelKey: "gaitCrawlForward", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kcrL", labelKey: "gaitCrawlLeft", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kcrR", labelKey: "gaitCrawlRight", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kgpF", labelKey: "gaitStrideForward", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kgpL", labelKey: "gaitStrideLeft", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kgpR", labelKey: "gaitStrideRight", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kphF", labelKey: "gaitPushForward", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kphL", labelKey: "gaitPushLeft", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kphR", labelKey: "gaitPushRight", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kmw", labelKey: "gaitMoonwalk", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kbdF", labelKey: "gaitBoundForward", products: Object.freeze(["bittle", "bittle_arm", "quaddle"]) }),
      Object.freeze({ command: "kcarpetF", labelKey: "gaitCarpetForward", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kcarpetL", labelKey: "gaitCarpetLeft", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kcarpetR", labelKey: "gaitCarpetRight", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "khlw", labelKey: "gaitSmallStep", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kjpF", labelKey: "gaitJumpForward", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "klftF", labelKey: "gaitLiftForward", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "klftL", labelKey: "gaitLiftLeft", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "klftR", labelKey: "gaitLiftRight", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kbackScoot", labelKey: "gaitBackScoot", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "kbbbk", labelKey: "gaitBackVariant", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "kdragWkF", labelKey: "gaitDragWalk", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "kgallop", labelKey: "gaitGallop", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "kmarchF", labelKey: "gaitMarchForward", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "ktiptoeF", labelKey: "gaitTiptoe", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "ktrB", labelKey: "gaitTrotBackward", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "kvt90L", labelKey: "gaitTurn90Left", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "kvt90R", labelKey: "gaitTurn90Right", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "kwkB", labelKey: "gaitWalkBackwardAlt", products: Object.freeze(["quaddle"]) }),
    ]),
    posture: Object.freeze([
      Object.freeze({ command: "kup", labelKey: "postureStand", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kbalance", labelKey: "postureBalance", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "ksit", labelKey: "postureSit", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "d", labelKey: "postureRest", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kstr", labelKey: "postureStr", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kbuttUp", labelKey: "postureButtUp", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kcalib", labelKey: "postureCalib", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "klu", labelKey: "postureLookUp", products: Object.freeze(["nybble"]) }),
      Object.freeze({ command: "kzero", labelKey: "postureZero", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
    ]),
    behavior: Object.freeze([
      Object.freeze({ command: "khi", labelKey: "behaviorHi", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "khsk", labelKey: "behaviorHandshake", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kfiv", labelKey: "behaviorHighFive", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "khg", labelKey: "behaviorHug", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "khu", labelKey: "behaviorHandsUp", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "knd", labelKey: "behaviorNod", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kcmh", labelKey: "behaviorComeHere", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kgdb", labelKey: "behaviorGoodBoy", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kchr", labelKey: "behaviorCheers", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kpee", labelKey: "behaviorPee", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "ksnf", labelKey: "behaviorSniff", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kck", labelKey: "behaviorCheck", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kdg", labelKey: "behaviorDig", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kang", labelKey: "behaviorAngry", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kscrh", labelKey: "behaviorScratch", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kwh", labelKey: "behaviorWaveHead", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "ktbl", labelKey: "behaviorTable", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kpd", labelKey: "behaviorPlayDead", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kpd2", labelKey: "behaviorPlayDead2", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "krl", labelKey: "behaviorRoll", products: Object.freeze(["bittle"]) }),
      Object.freeze({ command: "krc", labelKey: "behaviorRecover", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "krc2", labelKey: "behaviorRecover2", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "krcL", labelKey: "behaviorRecoverLeft", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "krcR", labelKey: "behaviorRecoverRight", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "kpu", labelKey: "behaviorPushUp", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kpu1", labelKey: "behaviorPushUp1", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kkc", labelKey: "behaviorKick", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "klpov", labelKey: "behaviorLeapOver", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kts", labelKey: "behaviorTest", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "khunt", labelKey: "behaviorHunt", products: Object.freeze(["nybble"]) }),
    ]),
    acrobatic: Object.freeze([
      Object.freeze({ command: "khds", labelKey: "acrobaticHandstand", products: Object.freeze(["bittle", "bittle_arm", "nybble", "quaddle"]) }),
      Object.freeze({ command: "kbx", labelKey: "acrobaticBoxing", products: Object.freeze(["bittle", "bittle_arm", "nybble"]) }),
      Object.freeze({ command: "kflipD", labelKey: "acrobaticBackflip", products: Object.freeze(["bittle"]) }),
      Object.freeze({ command: "kflipF", labelKey: "acrobaticFrontflip", products: Object.freeze(["bittle"]) }),
      Object.freeze({ command: "kjmp", labelKey: "acrobaticJump", products: Object.freeze(["bittle", "bittle_arm"]) }),
      Object.freeze({ command: "kbf", labelKey: "acrobaticBackflipBf", products: Object.freeze(["bittle", "quaddle"]) }),
      Object.freeze({ command: "kff", labelKey: "acrobaticFrontflipFf", products: Object.freeze(["bittle", "quaddle"]) }),
      Object.freeze({ command: "kflip", labelKey: "acrobaticFlip", products: Object.freeze(["bittle"]) }),
      Object.freeze({ command: "kjumpSlide", labelKey: "acrobaticJumpSlide", products: Object.freeze(["quaddle"]) }),
      Object.freeze({ command: "khighbar", labelKey: "acrobaticHighbar", products: Object.freeze(["quaddle"]) }),
    ]),
    modelSpecial: Object.freeze([
      Object.freeze({ command: "kpickD", labelKey: "armPickDown", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "kpickF", labelKey: "armPickFront", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "kpickL", labelKey: "armPickLeft", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "kpickR", labelKey: "armPickRight", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "kputD", labelKey: "armPutDown", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "kputF", labelKey: "armPutFront", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "kputL", labelKey: "armPutLeft", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "kputR", labelKey: "armPutRight", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "klaunch", labelKey: "armShoot", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "ktossF", labelKey: "armThrowFront", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "ktossL", labelKey: "armThrowLeft", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "ktossR", labelKey: "armThrowRight", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "khunt", labelKey: "armHunt", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "kshowOff", labelKey: "armShowOff", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "kclap", labelKey: "armClap", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "ktossD", labelKey: "armThrowDown", products: Object.freeze(["bittle_arm"]) }),
      Object.freeze({ command: "kheadToss", labelKey: "specialHeadToss", products: Object.freeze(["nybble"]) }),
      Object.freeze({ command: "kknock", labelKey: "specialKnock", products: Object.freeze(["nybble"]) }),
      Object.freeze({ command: "klkPaws", labelKey: "specialLickPaws", products: Object.freeze(["nybble"]) }),
      Object.freeze({ command: "klucky", labelKey: "specialLuckyCat", products: Object.freeze(["nybble"]) }),
      Object.freeze({ command: "kstand", labelKey: "specialStandUp", products: Object.freeze(["nybble"]) }),
      Object.freeze({ command: "kwsf", labelKey: "specialWashFace", products: Object.freeze(["nybble"]) }),
    ]),
  });

  function normalizeProduct(productType) {
    if (global.PetoiProducts && global.PetoiProducts.isValidType(productType)) {
      return productType;
    }
    return (global.PetoiProducts && global.PetoiProducts.defaultType) || "bittle";
  }

  function itemsFor(group, productType) {
    const selected = normalizeProduct(productType);
    const items = GROUPS[group] || [];
    return items.filter(function (item) {
      return item.products.indexOf(selected) !== -1;
    });
  }

  function hasGroup(group, productType) {
    return itemsFor(group, productType).length > 0;
  }

  function optionsFor(group, productType, getLabel) {
    return itemsFor(group, productType).map(function (item) {
      return [getLabel(item.labelKey), item.command];
    });
  }

  global.PetoiMotion = Object.freeze({
    hasGroup: hasGroup,
    optionsFor: optionsFor
  });
})(window);
