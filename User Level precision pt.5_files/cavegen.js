function count(item, array) {
  return [0].concat(array).reduce((total, nelevelPaddingt) => {
    if (nelevelPaddingt == item) {
      return total + 1;
    }
    else {
      return total;
    }
  })
};
levelPadding = 1;

function runCavingCycle(array) {
  let myHeight=array.length;
  let myWidth=array[0].length;
  let newLevel = array;
  let newRow = [[levelPadding].concat(array[0].map(i => levelPadding)).concat([levelPadding])];
  let oldLevel = newRow.concat(array.map(m => [levelPadding].concat(m).concat([levelPadding]))).concat(newRow);
  for (i = 0; i < newLevel.length; i++) {
    for (e = 0; e < newLevel[i].length; e++) {
      let thisNum = oldLevel[i + 1][e + 1];
      let adjacents = [oldLevel[i][e + 1], oldLevel[i + 1][e + 2], oldLevel[i + 2][e + 1], oldLevel[i][e + 1]];
      let neighbors = [oldLevel[i][e], oldLevel[i][e + 1], oldLevel[i][e + 2], oldLevel[i + 1][e], oldLevel[i + 1][e + 2], oldLevel[i + 2][e], oldLevel[i + 2][e + 1], oldLevel[i + 2][e + 2]]
      let total = {
        stones: count(1, neighbors),
        lava: count(3, neighbors),
        water: count(2, neighbors),
        coins: count(7, neighbors),
        air: count(0, neighbors)
      };
      //Air
      if (thisNum == 0) {
        if (total.stones >= 5) {
          newLevel[i][e] = 1;
        }
        else if (adjacents[0] == 3) {
          newLevel[i][e] = 3;
        }
        else if (adjacents[0] == 2) {
          newLevel[i][e] = 2;
        }
      }
      //Stone
      else if (thisNum == 1) {
        if (total.air > 5) {
          newLevel[i][e] = 0;
        }
        else if (adjacents[2] == 3 && oldLevel[i + 3][e + 1] == 1 && oldLevel[i + 2][e] == 1 && oldLevel[i + 2][e + 2] == 1) {
          newLevel[i][e] = 3;
        }
        else if (total.lava >= 6) {
          newLevel[i][e] = 3;
        }
      }
      //Water
      else if (thisNum == 2) {
        if (count(3, adjacents) > 0) {
          newLevel[i][e] = 1;
        }
        else if (adjacents[2] == 0 && count(1, adjacents) <= 2) {
          newLevel[i][e] = 0;
        }
        else if (adjacents[2] == 2 && count(1, adjacents) <= 2) {
          newLevel[i][e] = 0;
        }
      }
      //Lava
      else if (thisNum == 3) {
        if (count(2, adjacents) > 0) {
          newLevel[i][e] = 1;
        }
        else if (adjacents[2] == 0 && count(1, adjacents) <= 2) {
          newLevel[i][e] = 0;
        }
        else if (count(1, adjacents) == 4) {
          newLevel[i][e] = 1;
        }
        else if (adjacents[2] == 3 && count(1, adjacents) <= 2) {
          newLevel[i][e] = 0;
        }
      }
      //Coins
    }
  }
  newLevel[Math.floor(myWidth / 2)][Math.floor(myHeight / 2)] = 0;
  newLevel[Math.floor(myWidth / 2)][Math.floor(myHeight / 2) + 1] = 0;
  newLevel[Math.floor(myWidth / 2)][Math.floor(myHeight / 2) - 1] = 0;
  newLevel[Math.floor(myWidth / 2) - 1][Math.floor(myHeight / 2)] = 0;
  newLevel[Math.floor(myWidth / 2) - 1][
    Math.floor(myHeight / 2) + 1
  ] = 0;
  newLevel[Math.floor(myWidth / 2) - 1][
    Math.floor(myHeight / 2) - 1
  ] = 0;
  newLevel[Math.floor(myWidth / 2) + 1][Math.floor(myHeight / 2)] = 1;
  newLevel[Math.floor(myWidth / 2) + 1][
    Math.floor(myHeight / 2) + 1
  ] = 1;
  newLevel[Math.floor(myWidth / 2) + 1][
    Math.floor(myHeight / 2) - 1
  ] = 1; //clear the area around the player, give them a place to stand
  return newLevel;
}