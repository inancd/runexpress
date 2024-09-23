const PACE_MUL = 60 / 3.6;
function calc_pace(dist_mt, time_sec) {
  return (PACE_MUL * time_sec) / dist_mt;
}
async function generateLapJson(stepsArr, gpsArr, lapDistance) {
    let accumDist = 0;
    let accumTime = 0;
    let lapID = 1;
    let laps = [];
  
    for (let i = 0; i < stepsArr.length; i++) {
      const step = stepsArr[i];
      const stepDistance = step.distance;
      const stepTime = step.time_diff;
      let positionInStep = 0;
  
      while (positionInStep < 1) {
        const distanceRemaining = lapDistance - accumDist;
        const distanceAvailable = stepDistance * (1 - positionInStep);
  
        if (distanceAvailable >= distanceRemaining) {
          const fraction = distanceRemaining / stepDistance;
          const timeUsed = stepTime * fraction;
          accumDist += distanceRemaining;
          accumTime += timeUsed;
  
          const pace = calc_pace(lapDistance, accumTime);
  
          // Compute timestamp
          const totalFraction = positionInStep + fraction;
          const timestampPrev = gpsArr[i].timestamp;
          const timestampNext = gpsArr[i + 1] ? gpsArr[i + 1].timestamp : timestampPrev;
          const timestamp = timestampPrev + (timestampNext - timestampPrev) * totalFraction;
  
          laps.push({
            lapID: lapID,
            timestamp: timestamp,
            pace: pace,
          });
  
          lapID += 1;
          positionInStep += fraction;
          accumDist = 0;
          accumTime = 0;
  
          if (positionInStep >= 1) {
            break;
          }
        } else {
          accumDist += distanceAvailable;
          accumTime += stepTime * (1 - positionInStep);
          positionInStep = 1;
        }
      }
    }
  
    return laps;
}

const fixedStrings = ["initial", "running", "paused", "stopped", "saved"];
function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}
function calc_geodesic_sync(p1, p2) {
    let time_diff, φ1, φ2, λ1, λ2;
  
    if (p1.coords && p2.coords) {
      const t1 = new Date(p1.timestamp);
      const t2 = new Date(p2.timestamp);
      time_diff = (t2.getTime() - t1.getTime()) / 1000;
      φ1 = toRadians(p1.coords.latitude);
      φ2 = toRadians(p2.coords.latitude);
      λ1 = toRadians(p1.coords.longitude);
      λ2 = toRadians(p2.coords.longitude);
    } else {
      console.log("Invalid GPS data at points:", p1, p2);
      return { s_geo_len: 0, time_diff: 0 };
    }
  
    // WGS-84 ellipsoid parameters
    const a = 6378137.0;
    const b = 6356752.314245;
    const f = 1 / 298.257223563;
  
    const L = λ2 - λ1;
    const tanU1 = (1 - f) * Math.tan(φ1);
    const tanU2 = (1 - f) * Math.tan(φ2);
    const cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1);
    const cosU2 = 1 / Math.sqrt(1 + tanU2 * tanU2);
    const sinU1 = tanU1 * cosU1;
    const sinU2 = tanU2 * cosU2;
  
    let λ = L;
    let sinλ, cosλ, sinσ, cosσ, σ, sinα, cosSqα, cos2σₘ, C;
    let λʹ;
    let iterLimit = 100;
    do {
      sinλ = Math.sin(λ);
      cosλ = Math.cos(λ);
      sinσ = Math.sqrt(
        Math.pow(cosU2 * sinλ, 2) +
          Math.pow(cosU1 * sinU2 - sinU1 * cosU2 * cosλ, 2)
      );
  
      if (sinσ === 0) {
        return { s_geo_len: 0, time_diff: time_diff };
      }
  
      cosσ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
      σ = Math.atan2(sinσ, cosσ);
      sinα = (cosU1 * cosU2 * sinλ) / sinσ;
      cosSqα = 1 - sinα * sinα;
      cos2σₘ = cosσ - (2 * sinU1 * sinU2) / cosSqα;
  
      if (isNaN(cos2σₘ)) {
        cos2σₘ = 0;
      }
  
      C = (f / 16) * cosSqα * (4 + f * (4 - 3 * cosSqα));
      λʹ = λ;
      λ =
        L +
        (1 - C) *
          f *
          sinα *
          (σ +
            C *
              sinσ *
              (cos2σₘ + C * cosσ * (-1 + 2 * cos2σₘ * cos2σₘ)));
    } while (Math.abs(λ - λʹ) > 1e-12 && --iterLimit > 0);
  
    if (iterLimit === 0) {
      console.warn("calc_geodesic_sync: Iteration limit reached");
    }
  
    const uSq = (cosSqα * (a * a - b * b)) / (b * b);
    const A =
      1 +
      (uSq / 16384) *
        (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B =
      (uSq / 1024) *
      (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    const Δσ =
      B *
      sinσ *
      (cos2σₘ +
        (B / 4) *
          (cosσ * (-1 + 2 * cos2σₘ * cos2σₘ) -
            (B / 6) *
              cos2σₘ *
              (-3 + 4 * sinσ * sinσ) *
              (-3 + 4 * cos2σₘ * cos2σₘ)));
  
    const s_geo_len = b * A * (σ - Δσ);
  
    return {
      s_geo_len: s_geo_len,
      time_diff: time_diff,
    };
}
  
async function generateStepsArr(gpsArr) {
  if (!gpsArr || gpsArr.length < 2) return [];

  const stepsArr = [];
  let actType_prev = gpsArr[0].activityType;

  for (let i = 0; i < gpsArr.length - 1; i++) {
    const actType_curr = gpsArr[i + 1].activityType;
    const activityId = fixedStrings.findIndex((s) => s === actType_prev);

    if (actType_prev !== "running" && actType_prev !== "paused") {
      stepsArr.push({
        distance: 0,
        time_diff: 0,
        activityId: activityId,
      });
    } else if (actType_prev === "paused") {
      const t1 = new Date(gpsArr[i].timestamp);
      const t2 = new Date(gpsArr[i + 1].timestamp);
      stepsArr.push({
        distance: 0,
        time_diff: (t2.getTime() - t1.getTime()) / 1000,
        activityId: activityId,
      });
    } else if (actType_prev === "running") {
      const dif_last_two = calc_geodesic_sync(gpsArr[i], gpsArr[i + 1]);
      stepsArr.push({
        distance: dif_last_two.s_geo_len,
        time_diff: dif_last_two.time_diff,
        activityId: activityId,
      });
    } else {
      console.error("Unexpected activityType at index", i, "activityType:", actType_prev);
    }

    actType_prev = actType_curr;
  }

  return stepsArr;
}

module.exports = { generateLapJson, generateStepsArr };